import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../users/models/User';
import { IJob } from '../../jobs/models/Job';

export enum TaskType {
    COMPLAINT_HANDLE = 'COMPLAINT_HANDLE',
    DISPUTE_RESOLVE = 'DISPUTE_RESOLVE',
    QUALITY_CHECK = 'QUALITY_CHECK',
    EMERGENCY = 'EMERGENCY',
    GENERAL = 'GENERAL'
}

export enum TaskStatus {
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    ESCALATED = 'ESCALATED'
}

export interface ITask extends Document {
    title: string;
    description: string;
    type: TaskType;
    status: TaskStatus;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignedBy: IUser['_id'];
    assignedTo: IUser['_id'];
    zone: mongoose.Types.ObjectId;
    job?: IJob['_id'];
    complaint?: mongoose.Types.ObjectId;
    location?: string;
    resolutionNotes?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: Object.values(TaskType), default: TaskType.GENERAL },
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.ASSIGNED },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job' },
    complaint: { type: Schema.Types.ObjectId, ref: 'Complaint' },
    location: { type: String },
    resolutionNotes: { type: String },
    resolvedAt: { type: Date }
}, {
    timestamps: true
});

TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ assignedBy: 1 });
TaskSchema.index({ zone: 1 });
TaskSchema.index({ status: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
