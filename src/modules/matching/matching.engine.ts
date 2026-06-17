import redis from '../../config/redis';
import { RankingService } from '../workers/services/ranking.service';
import { WorkerProfile } from '../workers/models/WorkerProfile';
import { AppError } from '../../core/errors/AppError';
import { Logger } from '../../config/logger';

const SERVICE_SKILL_MAP: Record<string, string[]> = {
    'water-leakage': ['plumber', 'plumbing'],
    'tap-repair': ['plumber', 'plumbing'],
    'toilet-repair': ['plumber', 'plumbing'],
    'pipe-replacement': ['plumber', 'plumbing'],
    'water-tank-issues': ['plumber', 'plumbing'],
    'drain-blockage': ['plumber', 'plumbing'],
    'switch-repair': ['electrician', 'electrical'],
    'fan-repair': ['electrician', 'electrical'],
    'wiring-issues': ['electrician', 'electrical'],
    'mcb-replacement': ['electrician', 'electrical'],
    'power-outage-troubleshooting': ['electrician', 'electrical'],
    'inverter-connection': ['electrician', 'electrical'],
    'socket-installation': ['electrician', 'electrical'],
    'short-circuit-repair': ['electrician', 'electrical'],
    'washing-machine-repair': ['electrician', 'electrical', 'appliance-repair'],
    'ac-servicing': ['ac-technician', 'ac'],
    'gas-refill': ['ac-technician', 'ac'],
    'ac-installation': ['ac-technician', 'ac'],
    'ac-uninstallation': ['ac-technician', 'ac'],
    'cooling-issue': ['ac-technician', 'ac'],
    'ac-water-leakage': ['ac-technician', 'ac'],
    'pcb-repair': ['ac-technician', 'ac', 'electrical'],
    'bike-mechanic': ['mechanic', 'vehicle'],
    'car-mechanic': ['mechanic', 'vehicle'],
    'puncture-repair': ['mechanic', 'vehicle'],
    'battery-replacement': ['mechanic', 'vehicle'],
    'car-wash': ['mechanic', 'vehicle', 'car-wash']
};

export class MatchingEngine {

    private static readonly SEARCH_RADIUS_KM = 10;
    private static readonly MAX_WORKERS = 10;

    static getRequiredSkills(serviceType: string): string[] {
        return SERVICE_SKILL_MAP[serviceType] || [serviceType];
    }

    static async findBestWorkers(lat: number, long: number, serviceType: string) {
        const geoResults: any[] = await redis.georadius(
            'workers:locations',
            long,
            lat,
            this.SEARCH_RADIUS_KM,
            'km',
            'WITHDIST'
        );

        if (!geoResults || geoResults.length === 0) {
            Logger.info(`No workers found within ${this.SEARCH_RADIUS_KM}km for ${serviceType}`);
            return [];
        }

        const nearbyWorkerIds = geoResults.map((res: any) => res[0]);

        const requiredSkills = this.getRequiredSkills(serviceType);

        const eligibleWorkers = await WorkerProfile.find({
            user: { $in: nearbyWorkerIds },
            isOnline: true,
            skills: { $in: requiredSkills }
        });

        const rankedWorkers = eligibleWorkers
            .sort((a, b) => b.wilsonScore - a.wilsonScore)
            .slice(0, this.MAX_WORKERS);

        Logger.info(`Found ${rankedWorkers.length} eligible workers for ${serviceType}`);
        return rankedWorkers;
    }
}
