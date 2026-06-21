import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { Star, CheckCircle, Clock, XCircle, Search, RefreshCw } from "lucide-react";
import type { WorkerProfile } from "@/types";

export default function WorkersListPage() {
    const navigate = useNavigate();
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [search, setSearch] = useState("");
    const [verificationFilter, setVerificationFilter] = useState("all");

    const fetchWorkers = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const params = new URLSearchParams({ page: String(page), limit: "15" });
            if (search) params.set("search", search);
            const response = await api.get(`/admin/workers?${params.toString()}`);
            setWorkers(extractData(response));
            if (response.data.pagination) {
                setPagination(response.data.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch workers";
            setError(message);
            logger.error("Failed to fetch workers:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    const filteredWorkers = workers.filter((w) => {
        if (verificationFilter === "all") return true;
        return w.verificationStatus === verificationFilter;
    });

    const verificationBadge = (status: string) => {
        switch (status) {
            case "VERIFIED":
                return <Badge className="bg-green-100 text-green-800 border-0 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-100 text-red-800 border-0 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-800 border-0 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Workers</h1>
                    <p className="text-sm text-muted-foreground">{pagination.total || workers.length} total workers</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, phone..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9"
                    />
                </div>
                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchWorkers} title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {error && <PageError message={error} onRetry={fetchWorkers} />}

            {loading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : filteredWorkers.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <p>No workers found</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Worker</TableHead>
                                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead className="hidden md:table-cell">Jobs</TableHead>
                                    <TableHead>Verification</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredWorkers.map((worker) => (
                                    <TableRow
                                        key={worker._id}
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/workers/${worker._id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-sm font-medium text-primary">
                                                        {worker.user?.name?.charAt(0) || "W"}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{worker.user?.name || "Worker"}</p>
                                                    <p className="text-xs text-muted-foreground sm:hidden">{worker.user?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <p className="text-sm truncate">{worker.user?.email}</p>
                                            <p className="text-xs text-muted-foreground">{worker.user?.phone}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1 text-sm">
                                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                                {worker.avgRating?.toFixed(1) || "N/A"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <span className="text-sm">{worker.totalJobs || 0}</span>
                                        </TableCell>
                                        <TableCell>
                                            {verificationBadge(worker.verificationStatus)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/workers/${worker._id}`); }}>
                                                View
                                            </Button>
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
