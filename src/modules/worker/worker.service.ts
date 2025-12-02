import Worker, { IWorker } from './worker.model';
import { AppError } from '../../utils/AppError';

export const getWorkerProfile = async (workerId: string) => {
    const worker = await Worker.findById(workerId);
    if (!worker) {
        throw new AppError('Worker not found', 404);
    }
    return worker;
};

export const updateWorkerProfile = async (workerId: string, updateData: Partial<IWorker>) => {
    const worker = await Worker.findByIdAndUpdate(workerId, updateData, {
        new: true,
        runValidators: true,
    });
    if (!worker) {
        throw new AppError('Worker not found', 404);
    }
    return worker;
};

export const uploadDocuments = async (workerId: string, files: Express.Multer.File[]) => {
    const documentUrls = files.map((file) => file.path);
    const worker = await Worker.findByIdAndUpdate(
        workerId,
        { $push: { documents: { $each: documentUrls } } },
        { new: true }
    );
    if (!worker) {
        throw new AppError('Worker not found', 404);
    }
    return worker;
};

export const toggleAvailability = async (workerId: string) => {
    const worker = await Worker.findById(workerId);
    if (!worker) {
        throw new AppError('Worker not found', 404);
    }
    worker.isAvailable = !worker.isAvailable;
    await worker.save();
    return worker;
};
