import redis from '../../config/redis';
import { RankingService } from '../workers/services/ranking.service';
import { WorkerProfile } from '../workers/models/WorkerProfile';
import { AppError } from '../../core/errors/AppError';

export class MatchingEngine {

    // Config
    private static readonly SEARCH_RADIUS_KM = 10;
    private static readonly MAX_WORKERS = 10;

    /**
     * Finds the best workers for a given location and service type.
     * 1. Geospatial search from Redis.
     * 2. Filter by Skills/Service Type (via MongoDB lookups).
     * 3. Rank by Wilson Score.
     */
    static async findBestWorkers(lat: number, long: number, serviceType: string) {
        // 1. Redis Geo Search
        // Format: [member, distance, member, distance, ...] because of WITHDIST
        const geoResults: any[] = await redis.georadius(
            'workers:locations',
            long,
            lat,
            this.SEARCH_RADIUS_KM,
            'km',
            'WITHDIST'
        );

        if (!geoResults || geoResults.length === 0) {
            return [];
        }

        // Parse internal redis Structure: [[member, distance], [member, distance]] for 'ioredis' usually
        // But let's handle the specific return type of ioredis.georadius
        // For 'ioredis', it returns [[member, distance], ...] if WITHDIST is used.

        const nearbyWorkerIds = geoResults.map((res: any) => res[0]); // Extract UserIds

        // 2. Fetch Profiles & Filter by Skill
        const eligibleWorkers = await WorkerProfile.find({
            user: { $in: nearbyWorkerIds },
            isOnline: true,
            skills: serviceType // Simple array membership check
        });

        // 3. Rank Results
        // Mix Distance and Score? For now, purely Score.
        const rankedWorkers = eligibleWorkers.sort((a, b) => b.wilsonScore - a.wilsonScore);

        return rankedWorkers;
    }
}
