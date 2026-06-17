import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceCategory extends Document {
    name: string;
    slug: string;
    icon: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceCategorySchema: Schema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, {
    timestamps: true
});

ServiceCategorySchema.index({ slug: 1 });
ServiceCategorySchema.index({ isActive: 1 });

export const ServiceCategory = mongoose.model<IServiceCategory>('ServiceCategory', ServiceCategorySchema);
