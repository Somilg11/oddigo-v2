import { Request, Response, NextFunction } from 'express';
import * as contentService from './content.service';

// Banners
export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const banner = await contentService.createBanner(req.body);
        res.status(201).json({ status: 'success', data: { banner } });
    } catch (error) {
        next(error);
    }
};

export const getBanners = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeOnly = req.query.active !== 'false';
        const banners = await contentService.getBanners(activeOnly);
        res.status(200).json({ status: 'success', results: banners.length, data: { banners } });
    } catch (error) {
        next(error);
    }
};

export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await contentService.deleteBanner(req.params.id);
        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};

// Offers
export const createOffer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const offer = await contentService.createOffer(req.body);
        res.status(201).json({ status: 'success', data: { offer } });
    } catch (error) {
        next(error);
    }
};

export const getOffers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeOnly = req.query.active !== 'false';
        const offers = await contentService.getOffers(activeOnly);
        res.status(200).json({ status: 'success', results: offers.length, data: { offers } });
    } catch (error) {
        next(error);
    }
};

// App Config
export const setAppConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { key, value } = req.body;
        const config = await contentService.setAppConfig(key, value);
        res.status(200).json({ status: 'success', data: { config } });
    } catch (error) {
        next(error);
    }
};

export const getAppConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await contentService.getAppConfig(req.params.key);
        res.status(200).json({ status: 'success', data: { config } });
    } catch (error) {
        next(error);
    }
};

export const getAllConfigs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const configs = await contentService.getAllAppConfigs();
        res.status(200).json({ status: 'success', results: configs.length, data: { configs } });
    } catch (error) {
        next(error);
    }
}
