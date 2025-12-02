import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    phone: string;
    role: 'user' | 'admin';
    profileImage?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        coordinates?: [number, number]; // [longitude, latitude]
    };
    createdAt: Date;
    updatedAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        phone: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        profileImage: { type: String },
        address: {
            street: String,
            city: String,
            state: String,
            zip: String,
            coordinates: {
                type: [Number],
                index: '2dsphere',
            },
        },
    },
    { timestamps: true }
);

// @ts-ignore
UserSchema.pre('save', async function (next: (err?: mongoose.CallbackError) => void) {
    const user = this as any;
    if (!user.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password!);
};

export default mongoose.model<IUser>('User', UserSchema);
