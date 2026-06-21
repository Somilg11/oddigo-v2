import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { PageError } from "@/components/common/PageError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/common/Badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle, XCircle, Clock, FileText, Eye } from "lucide-react";

interface KYCDocument {
    _id: string;
    worker: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    documentType: string;
    documentUrl: string;
    status: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
    createdAt: string;
}

interface PendingVerificationsResponse {
    documents: KYCDocument[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const docTypeLabels: Record<string, string> = {
    AADHAAR: "Aadhaar Card",
    PAN: "PAN Card",
    BANK_DETAILS: "Bank Details",
    SKILL_TEST: "Skill Test",
    POLICE_VERIFICATION: "Police Verification",
};

const statusVariant: Record<string, "warning" | "success" | "danger" | "default"> = {
    SUBMITTED: "warning",
    VERIFIED: "success",
    REJECTED: "danger",
    PENDING: "default",
};

export default function PendingVerificationPage() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<KYCDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("SUBMITTED");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPending = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const params = new URLSearchParams({ page: String(page), limit: "15" });
            const response = await api.get(`/admin/workers/pending-verification?${params.toString()}`);
            const result = extractData<PendingVerificationsResponse>(response);
            setDocuments(result.documents || []);
            if (result.pagination) {
                setPagination(result.pagination);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch pending verifications";
            setError(message);
            logger.error("Failed to fetch pending verifications:", err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const handleSingleVerify = async (docId: string, status: "VERIFIED" | "REJECTED") => {
        try {
            setActionLoading(docId);
            await api.post("/admin/workers/bulk-verify", { documentIds: [docId], status });
            setDocuments(prev => prev.filter(d => d._id !== docId));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Operation failed";
            logger.error("Verify failed:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = !search ||
            doc.worker?.name?.toLowerCase().includes(search.toLowerCase()) ||
            doc.worker?.email?.toLowerCase().includes(search.toLowerCase()) ||
            doc.worker?.phone?.includes(search);
        const matchesStatus = statusFilter === "ALL" || doc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPending = documents.filter(d => d.status === "SUBMITTED").length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Pending Verifications</h1>
                    <p className="text-sm text-muted-foreground mt-1">{pagination.total} total documents</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
            ) : error ? (
                <PageError message={error} onRetry={fetchPending} />
            ) : filteredDocuments.length === 0 ? (
                <EmptyState title="No pending verifications" description="All worker KYC documents have been reviewed." />
            ) : (
                <>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Worker</TableHead>
                                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                                    <TableHead>Document</TableHead>
                                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocuments.map((doc) => (
                                    <TableRow
                                        key={doc._id}
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/workers/${doc.worker?._id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                                                    {doc.worker?.name?.charAt(0) || "W"}
                                                </div>
                                                <span className="font-medium">{doc.worker?.name || "Unknown"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="text-sm">
                                                <p className="text-muted-foreground">{doc.worker?.email}</p>
                                                <p className="text-muted-foreground">{doc.worker?.phone}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{docTypeLabels[doc.documentType] || doc.documentType}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Badge variant={statusVariant[doc.status] || "default"}>{doc.status}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => navigate(`/workers/${doc.worker?._id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {doc.status === "SUBMITTED" && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            disabled={actionLoading === doc._id}
                                                            onClick={() => handleSingleVerify(doc._id, "VERIFIED")}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            disabled={actionLoading === doc._id}
                                                            onClick={() => handleSingleVerify(doc._id, "REJECTED")}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
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
