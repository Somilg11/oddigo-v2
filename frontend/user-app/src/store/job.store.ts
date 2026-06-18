import { create } from 'zustand';
import type { ServiceCategory, SubService, Job, WorkerProfile } from '@/types';

interface BookingState {
    category: ServiceCategory | null;
    subService: SubService | null;
    issuePhotos: string[];
    issueVideos: string[];
    voiceNote: string;
    customIssue: string;
    createdJob: Job | null;
    selectedWorker: WorkerProfile | null;
    matchedWorkers: WorkerProfile[];
    setCategory: (category: ServiceCategory) => void;
    setSubService: (subService: SubService) => void;
    setIssueMedia: (photos: string[], videos: string[], voiceNote?: string, customIssue?: string) => void;
    setCreatedJob: (job: Job) => void;
    setMatchedWorkers: (workers: WorkerProfile[]) => void;
    setSelectedWorker: (worker: WorkerProfile) => void;
    resetBooking: () => void;
}

const initialState = {
    category: null,
    subService: null,
    issuePhotos: [],
    issueVideos: [],
    voiceNote: '',
    customIssue: '',
    createdJob: null,
    selectedWorker: null,
    matchedWorkers: [],
};

export const useJobStore = create<BookingState>()((set) => ({
    ...initialState,
    setCategory: (category) => set({ category }),
    setSubService: (subService) => set({ subService }),
    setIssueMedia: (photos, videos, voiceNote = '', customIssue = '') =>
        set({ issuePhotos: photos, issueVideos: videos, voiceNote, customIssue }),
    setCreatedJob: (job) => set({ createdJob: job }),
    setMatchedWorkers: (workers) => set({ matchedWorkers: workers }),
    setSelectedWorker: (worker) => set({ selectedWorker: worker }),
    resetBooking: () => set(initialState),
}));
