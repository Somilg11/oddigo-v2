import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d';

export interface TokenPayload {
    userId: string;
    role: string;
}

export const signAccessToken = (userId: Types.ObjectId | string, role: string): string => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const signRefreshToken = (userId: Types.ObjectId | string): string => {
    return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string };
};
