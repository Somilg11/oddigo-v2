import redis from '../../../config/redis';

export class MaintenanceService {
    private static readonly KEY_USER_APP = 'maintenance:user_app';
    private static readonly KEY_WORKER_APP = 'maintenance:worker_app';

    static async setMaintenanceMode(app: 'USER' | 'WORKER', enabled: boolean) {
        const key = app === 'USER' ? this.KEY_USER_APP : this.KEY_WORKER_APP;
        if (enabled) {
            await redis.set(key, 'true');
        } else {
            await redis.del(key);
        }
    }

    static async isMaintenanceMode(app: 'USER' | 'WORKER'): Promise<boolean> {
        const key = app === 'USER' ? this.KEY_USER_APP : this.KEY_WORKER_APP;
        const val = await redis.get(key);
        return val === 'true';
    }

    static async getStatus() {
        const [userApp, workerApp] = await Promise.all([
            this.isMaintenanceMode('USER'),
            this.isMaintenanceMode('WORKER')
        ]);
        return { userApp, workerApp };
    }
}
