import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'superadmin';
    createdAt: Date;
    updatedAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const AdminSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
    },
    { timestamps: true }
);

// @ts-ignore
AdminSchema.pre('save', async function (next: (err?: mongoose.CallbackError) => void) {
    const admin = this as any;
    if (!admin.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);
    next();
});

AdminSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password!);
};

export default mongoose.model<IAdmin>('Admin', AdminSchema);
