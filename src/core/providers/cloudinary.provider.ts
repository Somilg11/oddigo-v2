import { IStorageProvider, IServiceHealth } from '../interfaces/providers.interface';
import { AppError } from '../errors/AppError';
import { Logger } from '../../config/logger';

export class CloudinaryProvider implements IStorageProvider {
    public name = 'Cloudinary';
    private cloudName: string;
    private apiKey: string;
    private apiSecret: string;

    constructor() {
        this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
        this.apiKey = process.env.CLOUDINARY_API_KEY || '';
        this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    }

    private isConfigured(): boolean {
        return !!(this.cloudName && this.apiKey && this.apiSecret);
    }

    async uploadFile(fileData: Buffer, filename: string, mimeType: string): Promise<string> {
        if (!this.isConfigured()) {
            Logger.warn('Cloudinary not configured - returning placeholder URL');
            return `https://res.cloudinary.com/demo/image/upload/v1/${filename}`;
        }

        try {
            const timestamp = Math.round(Date.now() / 1000);
            const folder = this.getFolderFromMime(mimeType);

            const params = {
                timestamp,
                folder,
                public_id: filename.replace(/\.[^/.]+$/, ''),
            };

            const crypto = await import('crypto');
            const sortedParams = Object.entries(params)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

            const signature = crypto
                .createHmac('sha256', this.apiSecret)
                .update(sortedParams)
                .digest('hex');

            const formData = new FormData();
            const uint8Array = new Uint8Array(fileData);
            formData.append('file', new Blob([uint8Array], { type: mimeType }), filename);
            formData.append('api_key', this.apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('folder', folder);
            formData.append('public_id', params.public_id);
            formData.append('signature', signature);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new AppError(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`, 500);
            }

            const result = await response.json();
            Logger.info(`File uploaded to Cloudinary: ${result.secure_url}`);
            return result.secure_url;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            Logger.error(`Cloudinary upload error: ${error.message}`);
            throw new AppError(`File upload failed: ${error.message}`, 500);
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!this.isConfigured()) {
            Logger.warn('Cloudinary not configured - skipping delete');
            return;
        }

        try {
            const publicId = this.extractPublicId(fileUrl);
            if (!publicId) return;

            const timestamp = Math.round(Date.now() / 1000);
            const params = { timestamp, public_id: publicId };

            const crypto = await import('crypto');
            const sortedParams = Object.entries(params)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

            const signature = crypto
                .createHmac('sha256', this.apiSecret)
                .update(sortedParams)
                .digest('hex');

            const formData = new FormData();
            formData.append('public_id', publicId);
            formData.append('api_key', this.apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                Logger.error(`Cloudinary delete failed: ${errorData.error?.message}`);
            }
        } catch (error: any) {
            Logger.error(`Cloudinary delete error: ${error.message}`);
        }
    }

    async checkHealth(): Promise<IServiceHealth> {
        const start = Date.now();
        if (!this.isConfigured()) {
            return {
                service: 'Cloudinary Storage',
                status: 'DOWN',
                error: 'Cloudinary not configured - missing env vars',
                latency: 0
            };
        }

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/ping`
            );
            return {
                service: 'Cloudinary Storage',
                status: response.ok ? 'UP' : 'DOWN',
                latency: Date.now() - start
            };
        } catch (error: any) {
            return {
                service: 'Cloudinary Storage',
                status: 'DOWN',
                error: error.message,
                latency: Date.now() - start
            };
        }
    }

    private getFolderFromMime(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'oddigo/images';
        if (mimeType.startsWith('video/')) return 'oddigo/videos';
        if (mimeType.startsWith('audio/')) return 'oddigo/audio';
        return 'oddigo/documents';
    }

    private extractPublicId(fileUrl: string): string | null {
        try {
            const parts = fileUrl.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex === -1) return null;

            const withoutVersion = parts.slice(uploadIndex + 1);
            if (withoutVersion[0]?.startsWith('v')) {
                withoutVersion.shift();
            }

            const lastPart = withoutVersion.pop();
            if (!lastPart) return null;

            const nameWithoutExt = lastPart.split('.')[0];
            return [...withoutVersion, nameWithoutExt].join('/');
        } catch {
            return null;
        }
    }
}
