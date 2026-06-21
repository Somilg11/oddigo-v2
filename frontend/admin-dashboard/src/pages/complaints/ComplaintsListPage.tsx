import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpRight, User, Briefcase } from "lucide-react";
import type { Complaint } from "@/types";

const statusVariant: Record<string, "danger" | "info" | "warning" | "success" | "default"> = {
    OPEN: "danger",
    IN_REVIEW: "info",
    ESCALATED: "warning",
    RESOLVED: "success",
    CLOSED: "default",
};

const categoryLabels: Record<string, string> = {
    WORKER_BEHAVIOR: "Worker Behavior",
    QUALITY_ISSUE: "Quality Issue",
    PRICING_DISPUTE: "Pricing Dispute",
    NO_SHOW: "No Show",
    DAMAGE: "Damage",
    FRAUD: "Fraud",
    OTHER: "Other",
};

export default function ComplaintsListPage() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const fetchComplaints = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const params = new URLSearchParams({ page: String(page), limit: "15" });
            if (filter && filter !== "ALL") params.set("status", filter);
            if (search) params.set("search", search);
            const response = await api.get(`/admin/complaints?${params.toString()}`);
            setComplaints(extractData(response));
            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch complaints";
            setError(message);
            logger.error("Failed to fetch complaints:", err);
        } finally {
            setLoading(false);
        }
    }, [filter, page, search]);

    useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleFilterChange = (value: string) => {
        setFilter(value);
        setPage(1);
    };

    const getCustomerName = (c: Complaint) => {
        if (typeof c.customer === "object" && c.customer) return c.customer.name;
        return "Unknown";
    };

    const getWorkerName = (c: Complaint) => {
        if (typeof c.worker === "object" && c.worker) return c.worker.name;
        return "Unassigned";
    };

    const getJobService = (c: Complaint) => {
        if (typeof c.job === "object" && c.job) return c.job.subServiceName || c.job.serviceType || "—";
        return "—";
    };

    const getJobAmount = (c: Complaint) => {
        if (typeof c.job === "object" && c.job && c.job.finalQuote) return `₹${c.job.finalQuote}`;
        return "—";
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Complaints</h1>
                <p className="text-sm text-muted-foreground mt-1">{pagination.total} total complaints</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by description, category, or name..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={filter} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                        <SelectItem value="ESCALATED">Escalated</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
            ) : error ? (
                <PageError message={error} onRetry={fetchComplaints} />
            ) : complaints.length === 0 ? (
                <EmptyState title="No complaints" description="No complaints match the selected filter." />
            ) : (
                <>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                                    <TableHead className="hidden md:table-cell">Worker</TableHead>
                                    <TableHead className="hidden lg:table-cell">Job</TableHead>
                                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {complaints.map((complaint) => (
                                    <TableRow
                                        key={complaint._id}
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/complaints/${complaint._id}`)}
                                    >
                                        <TableCell>
                                            <p className="font-medium line-clamp-1 max-w-[200px]">{complaint.description}</p>
                                            {complaint.refundAmount ? (
                                                <p className="text-xs text-muted-foreground mt-0.5">Refund: ₹{complaint.refundAmount}</p>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">{getCustomerName(complaint)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">{getWorkerName(complaint)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                            {getJobService(complaint)}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {categoryLabels[complaint.category] || complaint.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[complaint.status] || "default"}>
                                                {complaint.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <ArrowUpRight className="h-4 w-4 text-muted-foreground inline" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                    <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}
