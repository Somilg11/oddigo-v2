export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN' | 'FIELD_EXECUTIVE' | 'ZONE_MANAGER' | 'CITY_MANAGER';

export interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    avatarUrl?: string;
    creditStatus?: 'GREEN' | 'RED';
    monthlyJobsCount?: number;
    isActive: boolean;
    addresses?: Address[];
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    street: string;
    city: string;
    zip: string;
    coordinates: [number, number];
}

export interface WorkerProfile {
    _id: string;
    user: User;
    isOnline: boolean;
    lastLocation?: {
        type: 'Point';
        coordinates: [number, number];
    };
    wilsonScore: number;
    reliabilityScore: number;
    totalJobs: number;
    onTimeJobs: number;
    avgRating: number;
    skills: string[];
    creditEligibility: 'ELIGIBLE' | 'NOT_ELIGIBLE';
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
}

export interface ServiceCategory {
    _id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    subServiceCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface SubService {
    _id: string;
    name: string;
    slug: string;
    category: ServiceCategory | string;
    description: string;
    basePrice: number;
    estimatedTime: number;
    pricingType: 'FIXED' | 'ESTIMATE';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type JobStatus =
    | 'CREATED'
    | 'MATCHING'
    | 'ACCEPTED'
    | 'IN_PROGRESS'
    | 'PAUSED_APPROVAL_PENDING'
    | 'OTP_PENDING'
    | 'ON_SITE_DIAGNOSIS'
    | 'FINAL_APPROVAL_PENDING'
    | 'REPAIR_IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED_CHARGED'
    | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CARD' | 'CASH' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface JobEstimate {
    visitCharge: number;
    labourCost: number;
    partsCost: number;
    totalEstimate: number;
    notes?: string;
    createdAt: string;
}

export interface JobAmendment {
    reason: string;
    evidenceUrl: string;
    proposedAmount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

export interface Job {
    _id: string;
    customer: User | string;
    worker?: User | string;
    serviceType: string;
    subService?: SubService | string;
    subServiceName?: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
        address?: string;
    };
    status: JobStatus;
    photos: string[];
    videos: string[];
    voiceNote?: string;
    customIssue?: string;
    aiAnalysis?: {
        problemType: string;
        possibleCauses: string[];
        estimatedCostRange: { low: number; high: number };
        confidence: number;
        reasoning: string;
    };
    initialQuote: number;
    finalQuote?: number;
    visitFee: number;
    estimate?: JobEstimate;
    amendment?: JobAmendment;
    otpVerifiedAt?: Date;
    customerSignature?: string;
    beforePhotos: string[];
    afterPhotos: string[];
    invoiceUrl?: string;
    completionProofUrl?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    transactionId?: string;
    warrantyId?: string;
    couponCode?: string;
    discount?: number;
    scheduledAt: string;
    startedAt?: string;
    workerArrivedAt?: string;
    diagnosisCompletedAt?: string;
    repairStartedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Rating {
    _id: string;
    job: Job | string;
    customer: User | string;
    worker: User | string;
    rating: number;
    review?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Warranty {
    _id: string;
    job: Job | string;
    expiresAt: string;
    isActive: boolean;
    coverageDetails: string;
    createdAt: string;
    updatedAt: string;
}

export type WarrantyClaimStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED';

export interface WarrantyClaim {
    _id: string;
    warranty: Warranty | string;
    job: Job | string;
    customer: User | string;
    worker?: User | string;
    description: string;
    photos: string[];
    status: WarrantyClaimStatus;
    adminNotes?: string;
    resolvedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DashboardStats {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalRevenue: number;
    totalWorkers: number;
    activeWorkers: number;
    totalCustomers: number;
    totalExecutives: number;
    pendingApprovals: number;
    openComplaints: number;
}

export interface Notification {
    _id: string;
    user: User | string;
    title?: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "ESCALATED" | "RESOLVED" | "CLOSED";

export interface Complaint {
    _id: string;
    customer: User | string;
    worker?: User | string;
    job?: Job | string;
    category: string;
    description: string;
    photos: string[];
    status: ComplaintStatus;
    priority: string;
    resolution?: string;
    refundAmount?: number;
    resolvedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LiveOperations {
    pendingRequests: number;
    workersOnline: number;
    workersBusy: number;
    workersOffline: number;
    activeJobs: number;
}

export type BannerType = 'PROMOTION' | 'ANNOUNCEMENT' | 'COUPON' | 'INFO';

export interface Banner {
    _id: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    linkUrl?: string;
    type: BannerType;
    isActive: boolean;
    sortOrder: number;
    startsAt?: string;
    expiresAt?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export type CouponType = 'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY';

export interface Coupon {
    _id: string;
    code: string;
    description: string;
    type: CouponType;
    value: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    usageCount: number;
    perUserLimit?: number;
    applicableCategories?: string[];
    isActive: boolean;
    startsAt?: string;
    expiresAt?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: {
        items: T[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}
