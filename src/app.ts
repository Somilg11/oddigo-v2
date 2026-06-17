import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
// xss-clean removed - no types available, using helmet for XSS protection
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { Logger } from './config/logger';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again in 15 minutes'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again in 15 minutes'
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// Data Sanitization
app.use(mongoSanitize());
app.use(hpp());

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
    Logger.http(`${req.method} ${req.url}`);
    next();
});

// Body Parsing
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Maintenance Check Middleware
import { maintenanceMiddleware } from './core/middlewares/maintenance.middleware';
import routes from './routes';

app.use(maintenanceMiddleware);

// Routes mounting
app.use('/api', routes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    Logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;
