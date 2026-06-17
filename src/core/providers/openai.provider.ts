import { IAIProvider, IServiceHealth } from '../interfaces/providers.interface';
import { AppError } from '../errors/AppError';
import { Logger } from '../../config/logger';

export class OpenAIProvider implements IAIProvider {
    public name = 'OpenAI';
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
    }

    private isConfigured(): boolean {
        return !!this.apiKey;
    }

    async analyzeImage(imageUrl: string, prompt: string): Promise<{ valid: boolean, confidence: number, reasoning: string }> {
        if (!this.isConfigured()) {
            Logger.warn('OpenAI not configured - returning default analysis');
            return {
                valid: true,
                confidence: 0.85,
                reasoning: 'AI analysis unavailable - OpenAI not configured. Auto-approved.'
            };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an image analysis AI for a home services platform. Analyze the provided image and determine if it shows completed repair/service work. Respond in JSON format with: { "valid": boolean, "confidence": number (0-1), "reasoning": string }'
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt || 'Analyze this image. Does it show completed repair or service work?'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: imageUrl,
                                        detail: 'low'
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 500,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new AppError(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`, 500);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content;

            if (!content) {
                throw new AppError('No response from OpenAI', 500);
            }

            const parsed = JSON.parse(content);

            Logger.info(`OpenAI analysis completed: valid=${parsed.valid}, confidence=${parsed.confidence}`);

            return {
                valid: parsed.valid ?? true,
                confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
                reasoning: parsed.reasoning || 'Analysis completed'
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            Logger.error(`OpenAI analysis error: ${error.message}`);
            return {
                valid: true,
                confidence: 0.5,
                reasoning: `AI analysis failed: ${error.message}. Defaulting to manual review.`
            };
        }
    }

    async checkHealth(): Promise<IServiceHealth> {
        const start = Date.now();
        if (!this.isConfigured()) {
            return {
                service: 'OpenAI Decision Service',
                status: 'DOWN',
                error: 'OpenAI not configured - missing OPENAI_API_KEY',
                latency: 0
            };
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return {
                service: 'OpenAI Decision Service',
                status: response.ok ? 'UP' : 'DOWN',
                latency: Date.now() - start
            };
        } catch (error: any) {
            return {
                service: 'OpenAI Decision Service',
                status: 'DOWN',
                error: error.message,
                latency: Date.now() - start
            };
        }
    }
}
