import { useEffect, useState, useCallback } from "react";
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
import { Search, AlertTriangle, MapPin, User, Briefcase } from "lucide-react";
import type { Job } from "@/types";

export default function DisputesPage() {
    const [disputes, setDisputes] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const fetchDisputes = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const params = new URLSearchParams({ page: String(page), limit: "15" });
            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
            const response = await api.get(`/admin/disputes?${params.toString()}`);
            setDisputes(extractData(response));
            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch disputes";
            setError(message);
            logger.error("Failed to fetch disputes:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const getCustomerName = (job: Job) => {
        if (typeof job.customer === "object" && job.customer) return job.customer.name;
        return "Unknown";
    };

    const getWorkerName = (job: Job) => {
        if (typeof job.worker === "object" && job.worker) return job.worker.name;
        return "Unknown";
    };

    const getAmount = (job: Job) => {
        return job.finalQuote ? `₹${job.finalQuote}` : job.initialQuote ? `₹${job.initialQuote}` : "—";
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">Disputes</h1>
                <p className="text-sm text-muted-foreground mt-1">{pagination.total} cancelled or charged jobs</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by service, name, or address..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="CANCELLED_CHARGED">Cancelled (Charged)</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
            ) : error ? (
                <PageError message={error} onRetry={fetchDisputes} />
            ) : disputes.length === 0 ? (
                <EmptyState title="No disputes" description="Cancelled or charged jobs will appear here." />
            ) : (
                <>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                                    <TableHead className="hidden md:table-cell">Worker</TableHead>
                                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                                    <TableHead className="hidden sm:table-cell">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {disputes.map((job) => (
                                    <TableRow key={job._id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{job.subServiceName || job.serviceType}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">{getCustomerName(job)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-sm">{getWorkerName(job)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate max-w-[200px]">{job.location?.address || "No address"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-sm font-medium">
                                            {getAmount(job)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="warning">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                {job.status.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                            {new Date(job.createdAt).toLocaleDateString()}
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
