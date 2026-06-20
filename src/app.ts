import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { mongoSanitizeMiddleware } from './core/middlewares/mongo-sanitize.middleware';
// xss-clean removed - no types available, using helmet for XSS protection
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { Logger } from './config/logger';

const app = express();

// Security Middlewares
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
if (allowedOrigins.length === 0) {
    Logger.warn('No ALLOWED_ORIGINS configured — CORS will reject all cross-origin requests');
}
app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Type'],
    credentials: true
}));

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests from this IP, please try again in 15 minutes'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again in 15 minutes'
});

const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many payment attempts, please try again later'
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/jobs/:jobId/pay', paymentLimiter);
app.use('/api/jobs/:jobId/pay/confirm', paymentLimiter);

// Data Sanitization
app.use(mongoSanitizeMiddleware());
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
