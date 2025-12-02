import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import workerRoutes from './modules/worker/worker.routes';
import adminRoutes from './modules/admin/admin.routes';
import orderRoutes from './modules/order/order.routes';
import reviewRoutes from './modules/review/review.routes';
import contentRoutes from './modules/content/content.routes';
import errorHandler from './middlewares/errorHandler';
import { AppError } from './utils/AppError';

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/content', contentRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// 404 Handler
// 404 Handler
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);


export { app, httpServer, io };
