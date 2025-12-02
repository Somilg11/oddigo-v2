import { Banner, Offer, AppConfig, IBanner, IOffer, IAppConfig } from './content.model';
import { AppError } from '../../utils/AppError';

// Banner Services
export const createBanner = async (data: Partial<IBanner>) => {
    return await Banner.create(data);
};

export const getBanners = async (activeOnly: boolean = true) => {
    const query = activeOnly ? { isActive: true } : {};
    return await Banner.find(query);
};

export const deleteBanner = async (id: string) => {
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) throw new AppError('Banner not found', 404);
    return banner;
};

// Offer Services
export const createOffer = async (data: Partial<IOffer>) => {
    return await Offer.create(data);
};

export const getOffers = async (activeOnly: boolean = true) => {
    const query = activeOnly ? { isActive: true, validUntil: { $gt: new Date() } } : {};
    return await Offer.find(query);
};

// App Config Services
export const setAppConfig = async (key: string, value: any) => {
    return await AppConfig.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
};

export const getAppConfig = async (key: string) => {
    const config = await AppConfig.findOne({ key });
    if (!config) throw new AppError('Config not found', 404);
    return config;
};

export const getAllAppConfigs = async () => {
    return await AppConfig.find();
}
