export type UserRole = 'ZONE_MANAGER' | 'CITY_MANAGER' | 'FIELD_EXECUTIVE';

export interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    avatarUrl?: string;
    isActive: boolean;
    createdAt: string;
}

export interface Zone {
    _id: string;
    name: string;
    city: string;
    center: { type: string; coordinates: [number, number] };
    radiusKm: number;
    manager?: User;
    fieldExecutives?: User[];
    isActive: boolean;
    createdAt: string;
}

export interface ZoneStats {
    zone: { name: string; city: string };
    metrics: {
        revenue: number;
        totalJobs: number;
        activeWorkers: number;
        pendingJobs: number;
        completedJobs: number;
    };
}

export interface SupplyDemand {
    zone: { name: string };
    supply: { online: number; busy: number; available: number };
    demand: { pendingRequests: number; last24h: string };
    ratio: number;
    needsRecruitment: boolean;
}

export interface CityDashboard {
    metrics: {
        totalOrders: number;
        monthlyRevenue: number;
        activeWorkers: number;
        pendingJobs: number;
        completedToday: number;
        cancelledToday: number;
        cancellationRate: string;
        averageRating: number;
    };
}

export interface CityOverview {
    zones: (Zone & {
        stats: {
            totalJobs: number;
            completedJobs: number;
            activeJobs: number;
            cancelledJobs: number;
            todayJobs: number;
            revenue: number;
        };
    })[];
    cityStats: {
        totalJobs: number;
        completedJobs: number;
        activeJobs: number;
        cancelledJobs: number;
        todayCompleted: number;
        todayCancelled: number;
        revenue: number;
    };
    complaints: CityComplaint[];
    disputes: CityDispute[];
    emergencies: CityEmergency[];
    complaintSummary: Record<string, number>;
}

export interface CityComplaint {
    _id: string;
    customer: { name: string; phone: string } | string;
    worker: { name: string; phone: string } | string;
    job: { serviceType: string; subServiceName: string; status: string } | string;
    category: string;
    description: string;
    status: string;
    priority: string;
    createdAt: string;
}

export interface CityDispute {
    _id: string;
    customer: { name: string; phone: string } | string;
    worker: { name: string; phone: string } | string;
    serviceType: string;
    subServiceName?: string;
    status: string;
    finalQuote?: number;
    location?: { address?: string };
    createdAt: string;
}

export interface CityEmergency {
    _id: string;
    customer: { name: string; phone: string } | string;
    worker: { name: string; phone: string } | string;
    serviceType: string;
    subServiceName?: string;
    status: string;
    location?: { address?: string };
    createdAt: string;
}

export interface FieldExecWorker {
    _id: string;
    user: User;
    isOnline: boolean;
    lastLocation?: { type: string; coordinates: [number, number] };
    avgRating: number;
    totalJobs: number;
    skills: string[];
    verificationStatus: string;
}

export interface FieldVisit {
    _id: string;
    worker: User | string;
    fieldExecutive: string;
    type: "CHECK_IN" | "FOLLOW_UP" | "QUALITY_AUDIT" | "COMPLAINT_HANDLE";
    notes: string;
    photos: string[];
    createdAt: string;
}

export interface QualityAudit {
    _id: string;
    job: { _id: string; serviceType: string; status: string } | string;
    worker: User | string;
    fieldExecutive: string;
    hasBeforePhotos: boolean;
    hasAfterPhotos: boolean;
    invoiceValid: boolean;
    notes: string;
    status: "PASSED" | "FAILED";
    createdAt: string;
}

export interface Campaign {
    _id: string;
    name: string;
    description?: string;
    city: string;
    discountPercent?: number;
    discountCode?: string;
    startDate: string;
    endDate: string;
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
    createdBy: string;
    createdAt: string;
}

export interface Task {
    _id: string;
    title: string;
    description: string;
    type: "COMPLAINT_HANDLE" | "DISPUTE_RESOLVE" | "QUALITY_CHECK" | "EMERGENCY" | "GENERAL";
    status: "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    assignedBy: { name: string; email: string } | string;
    assignedTo: { name: string; email: string; phone: string } | string;
    zone: { name: string; city: string } | string;
    job?: { serviceType: string; subServiceName: string; status: string; location?: { address?: string } } | string;
    complaint?: string;
    location?: string;
    resolutionNotes?: string;
    resolvedAt?: string;
    createdAt: string;
}

export interface ZoneManagerOverview {
    zones: Zone[];
    fieldExecutives: User[];
    complaints: CityComplaint[];
    disputes: CityDispute[];
    tasks: Task[];
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
