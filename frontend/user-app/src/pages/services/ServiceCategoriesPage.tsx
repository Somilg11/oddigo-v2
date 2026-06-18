import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useJobStore } from "@/store/job.store";
import type { ServiceCategory } from "@/types";

export default function ServiceCategoriesPage() {
    const navigate = useNavigate();
    const setCategory = useJobStore((s) => s.setCategory);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get("/services/categories");
                setCategories(response.data.data);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleSelect = (cat: ServiceCategory) => {
        setCategory(cat);
        navigate(`/services/${cat._id}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Choose a Service</h1>
            {categories.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No services available yet.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((cat) => (
                        <Card
                            key={cat._id}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleSelect(cat)}
                        >
                            <CardHeader className="text-center pb-2">
                                <div className="text-4xl mb-2">{cat.icon || "🔧"}</div>
                                <CardTitle className="text-sm">{cat.name}</CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
