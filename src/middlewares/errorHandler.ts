import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import logger from '../config/logger';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (err instanceof ZodError) {
        const zodErr = err as any;
        zodErr.statusCode = 400;
        zodErr.status = 'fail';
        zodErr.message = (err as any).errors.map((e: any) => e.message).join(', ');
    }

    if (err.code === 11000) {
        err.statusCode = 400;
        err.status = 'fail';
        err.message = 'Duplicate field value entered';
    }

    console.error('ERROR 💥', err);

    if (process.env.NODE_ENV === 'development') {
        logger.error(err);
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // Production
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            // Programming or other unknown error: don't leak error details
            logger.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!',
            });
        }
    }
};

export default errorHandler;
