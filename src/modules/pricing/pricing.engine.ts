import { SubService, PricingType } from '../../modules/services/models/SubService';
import { AppError } from '../../core/errors/AppError';
import { Logger } from '../../config/logger';

export interface PricingRequest {
    serviceType: string;
    subServiceId?: string;
    distanceKm: number;
    basePrice?: number;
    demandLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    timeOfDay?: 'PEAK' | 'OFF_PEAK' | 'NORMAL';
}

export class PricingEngine {

    private static readonly RATE_PER_KM = 5;
    private static readonly VISIT_FEE = 99;
    private static readonly PEAK_SURGE = 1.5;
    private static readonly MEDIUM_SURGE = 1.2;
    private static readonly OFF_PEAK_DISCOUNT = 0.9;

    static async calculatePrice(request: PricingRequest): Promise<{
        basePrice: number;
        distanceCost: number;
        visitFee: number;
        surgeMultiplier: number;
        totalEstimate: number;
        totalMin: number;
        totalMax: number;
        pricingType: PricingType;
    }> {
        const {
            distanceKm,
            serviceType,
            subServiceId,
            demandLevel = 'LOW',
            timeOfDay = 'NORMAL'
        } = request;

        let basePrice = request.basePrice;

        if (subServiceId) {
            const subService = await SubService.findById(subServiceId);
            if (subService) {
                basePrice = subService.basePrice;
            }
        }

        if (!basePrice) {
            const subService = await SubService.findOne({ slug: serviceType });
            basePrice = subService?.basePrice || 100;
        }

        let surgeMultiplier = 1.0;
        if (demandLevel === 'HIGH') {
            surgeMultiplier = this.PEAK_SURGE;
        } else if (demandLevel === 'MEDIUM') {
            surgeMultiplier = this.MEDIUM_SURGE;
        }

        if (timeOfDay === 'PEAK') {
            surgeMultiplier *= this.PEAK_SURGE;
        } else if (timeOfDay === 'OFF_PEAK') {
            surgeMultiplier *= this.OFF_PEAK_DISCOUNT;
        }

        const distanceCost = distanceKm * this.RATE_PER_KM;
        const totalEstimate = (basePrice + distanceCost + this.VISIT_FEE) * surgeMultiplier;

        const totalMin = Math.round(totalEstimate * 0.8 * 100) / 100;
        const totalMax = Math.round(totalEstimate * 1.3 * 100) / 100;

        return {
            basePrice,
            distanceCost,
            visitFee: this.VISIT_FEE,
            surgeMultiplier,
            totalEstimate: Math.round(totalEstimate * 100) / 100,
            totalMin,
            totalMax,
            pricingType: PricingType.ESTIMATE
        };
    }

    static async getEstimate(serviceType: string, distanceKm: number, subServiceId?: string): Promise<{
        basePrice: number;
        totalEstimate: number;
        totalMin: number;
        totalMax: number;
        pricingType: PricingType;
    }> {
        const result = await this.calculatePrice({
            serviceType,
            subServiceId,
            distanceKm,
            demandLevel: 'LOW',
            timeOfDay: 'NORMAL'
        });

        return {
            basePrice: result.basePrice,
            totalEstimate: result.totalEstimate,
            totalMin: result.totalMin,
            totalMax: result.totalMax,
            pricingType: result.pricingType
        };
    }

    static async getFixedPrice(subServiceId: string): Promise<number> {
        const subService = await SubService.findById(subServiceId);
        if (!subService) {
            throw new AppError('Sub-service not found', 404);
        }
        if (subService.pricingType !== PricingType.FIXED) {
            throw new AppError('This service does not have a fixed price', 400);
        }
        return subService.basePrice;
    }
}
