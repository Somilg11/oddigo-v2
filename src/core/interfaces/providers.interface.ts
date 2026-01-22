export interface IServiceHealth {
    service: string;
    status: 'UP' | 'DOWN';
    latency?: number;
    error?: string;
}

export interface IPaymentProvider {
    name: string;
    createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<any>;
    refundPayment(transactionId: string, amount?: number): Promise<any>;
    checkHealth(): Promise<IServiceHealth>;
}

export interface IEmailProvider {
    name: string;
    sendEmail(to: string, subject: string, html: string): Promise<void>;
    checkHealth(): Promise<IServiceHealth>;
}

export interface IOTPProvider {
    name: string;
    generate(): string;
    send(to: string, code: string): Promise<void>;
    verify(to: string, code: string): Promise<boolean>;
    checkHealth(): Promise<IServiceHealth>;
}

export interface IStorageProvider {
    name: string;
    uploadFile(fileData: Buffer, filename: string, mimeType: string): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
    checkHealth(): Promise<IServiceHealth>;
}

export interface IAIProvider {
    name: string;
    analyzeImage(imageUrl: string, prompt: string): Promise<{ valid: boolean, confidence: number, reasoning: string }>;
    checkHealth(): Promise<IServiceHealth>;
}
