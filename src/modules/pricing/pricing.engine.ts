import { AppError } from '../../core/errors/AppError';

export interface PricingRequest {
    serviceType: string;
    distanceKm: number;
    basePrice: number;
    demandLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class PricingEngine {

    // Configurable rates per km (could be moved to DB/Config)
    private static readonly RATE_PER_KM = 5; // $5 per km
    private static readonly VISIT_FEE = 20;  // Flat fee

    static calculatePrice(request: PricingRequest): number {
        const { distanceKm, basePrice, demandLevel = 'LOW' } = request;

        let surgeMultiplier = 1.0;

        switch (demandLevel) {
            case 'MEDIUM': surgeMultiplier = 1.2; break;
            case 'HIGH': surgeMultiplier = 1.5; break;
        }

        const distanceCost = distanceKm * this.RATE_PER_KM;

        // Formula: (Base + Distance + Visit) * Surge
        const total = (basePrice + distanceCost + this.VISIT_FEE) * surgeMultiplier;

        return Math.round(total * 100) / 100; // Round to 2 decimals
    }

    static getEstimate(serviceType: string, distanceKm: number): number {
        // Mock base prices for services (Move to ServiceCatalog later)
        const basePrices: Record<string, number> = {
            'cleaning': 50,
            'plumbing': 80,
            'electrican': 70
        };

        const base = basePrices[serviceType] || 60; // Default

        return this.calculatePrice({
            serviceType,
            distanceKm,
            basePrice: base,
            demandLevel: 'LOW' // Default to low for estimates unless specific logic applied
        });
    }
}
