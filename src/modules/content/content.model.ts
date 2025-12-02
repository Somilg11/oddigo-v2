import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
    imageUrl: string;
    targetScreen: string; // e.g., 'Home', 'WorkerProfile'
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOffer extends Document {
    code: string;
    description: string;
    discountPercentage: number;
    maxDiscount: number;
    validUntil: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAppConfig extends Document {
    key: string; // e.g., 'layout_config', 'maintenance_mode'
    value: any; // JSON object or primitive
    updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
    {
        imageUrl: { type: String, required: true },
        targetScreen: { type: String, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const OfferSchema: Schema = new Schema(
    {
        code: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        discountPercentage: { type: Number, required: true },
        maxDiscount: { type: Number, required: true },
        validUntil: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const AppConfigSchema: Schema = new Schema(
    {
        key: { type: String, required: true, unique: true },
        value: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);
export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);
export const AppConfig = mongoose.model<IAppConfig>('AppConfig', AppConfigSchema);
