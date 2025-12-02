import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [banners, setBanners] = useState<any[]>([]);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await api.get("/content/banners");
                setBanners(response.data.data.banners);
            } catch (error) {
                console.error("Failed to fetch banners", error);
            }
        };
        fetchBanners();
    }, []);

    const handleLogout = () => {
        logout();
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Oddigo</h1>
                <div className="flex items-center gap-4">
                    <span>Welcome, {user?.name}</span>
                    <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
            </header>

            <main className="p-8 max-w-6xl mx-auto">
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Featured</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {banners.map((banner) => (
                            <Card key={banner._id} className="overflow-hidden">
                                <img src={banner.imageUrl} alt="Banner" className="w-full h-48 object-cover" />
                            </Card>
                        ))}
                        {banners.length === 0 && <p className="text-gray-500">No active banners.</p>}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">Services</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["Plumber", "Electrician", "Cleaner", "Carpenter"].map((service) => (
                            <Card key={service} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <CardTitle className="text-center">{service}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center">
                                    <Button onClick={() => navigate(`/search?serviceType=${service}`)}>Book Now</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
