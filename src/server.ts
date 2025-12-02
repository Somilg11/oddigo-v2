import dotenv from 'dotenv';
dotenv.config();

import { httpServer } from './app';
import connectDB from './config/database';
import logger from './config/logger';

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

httpServer.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
