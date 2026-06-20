import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { extractData } from "@/lib/api-helpers";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState, useEffect } from "react";
import { ArrowLeft, Check, Plus, Trash2, MapPin, Home, Briefcase, Pencil, Camera, User, Mail, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { Address, AddressLabel, Gender } from "@/types";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
    gender: z.enum(["MALE", "FEMALE", "OTHER", ""]).optional(),
    dateOfBirth: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const addressSchema = z.object({
    label: z.enum(["HOME", "WORK", "OTHER"]),
    street: z.string().min(3, "Street address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
    landmark: z.string().optional(),
});
type AddressFormValues = z.infer<typeof addressSchema>;

export default function EditProfilePage() {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [savingAddress, setSavingAddress] = useState(false);
    const [showLocationDialog, setShowLocationDialog] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [selectedGender, setSelectedGender] = useState<Gender | "">((user?.gender as Gender) || "");

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            gender: user?.gender || "",
            dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        },
    });

    const addressForm = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: { label: "HOME", street: "", city: "", state: "", pincode: "", landmark: "" },
    });

    useEffect(() => {
        if (user?.addresses) setAddresses(user.addresses);
    }, [user?.addresses]);

    const onProfileSubmit = async (data: ProfileFormValues) => {
        try {
            setError(null);
            const payload: Record<string, unknown> = { ...data, gender: selectedGender || undefined };
            if (!payload.gender) delete payload.gender;
            if (!payload.dateOfBirth) delete payload.dateOfBirth;
            const response = await api.patch("/users/me", payload);
            const updated = extractData<any>(response);
            if (updated && typeof updated === "object" && "name" in updated) {
                setUser(updated);
            }
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update profile.";
            setError(message);
            logger.error("Failed to update profile", err);
        }
    };

    const onAddressSubmit = async (data: AddressFormValues) => {
        try {
            setSavingAddress(true);
            if (editingAddressId) {
                await api.patch(`/users/addresses/${editingAddressId}`, data);
                toast.success("Address updated");
            } else {
                await api.post("/users/addresses", data);
                toast.success("Address added");
            }
            const response = await api.get("/users/me");
            const updated = extractData<any>(response);
            if (updated?.addresses) setAddresses(updated.addresses);
            setShowAddressForm(false);
            setEditingAddressId(null);
            addressForm.reset({ label: "HOME", street: "", city: "", state: "", pincode: "", landmark: "" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save address";
            toast.error(message);
        } finally {
            setSavingAddress(false);
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            await api.delete(`/users/addresses/${id}`);
            setAddresses(prev => prev.filter(a => a._id !== id));
            toast.success("Address deleted");
        } catch {
            toast.error("Failed to delete address");
        }
    };

    const setDefault = async (id: string) => {
        try {
            await api.patch(`/users/addresses/${id}/default`);
            setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
            toast.success("Default address updated");
        } catch {
            toast.error("Failed to set default");
        }
    };

    const startEditAddress = (addr: Address) => {
        setEditingAddressId(addr._id || null);
        addressForm.reset({
            label: addr.label,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            landmark: addr.landmark || "",
        });
        setShowAddressForm(true);
    };

    const useDeviceLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported by your browser");
            setShowLocationDialog(false);
            openManualAddress();
            return;
        }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();
                    const addr = data.address || {};
                    addressForm.reset({
                        label: "HOME",
                        street: [addr.house_number, addr.road].filter(Boolean).join(" ") || "",
                        city: addr.city || addr.town || addr.village || "",
                        state: addr.state || "",
                        pincode: addr.postcode || "",
                        landmark: addr.neighbourhood || addr.suburb || "",
                    });
                    setEditingAddressId(null);
                    setShowAddressForm(true);
                    toast.success("Location detected! Review and save your address.");
                } catch {
                    toast.error("Could not fetch address. Please enter manually.");
                    openManualAddress();
                } finally {
                    setLocationLoading(false);
                    setShowLocationDialog(false);
                }
            },
            () => {
                setLocationLoading(false);
                setShowLocationDialog(false);
                toast.error("Location access denied. Please enter manually.");
                openManualAddress();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const openManualAddress = () => {
        setEditingAddressId(null);
        addressForm.reset({ label: "HOME", street: "", city: "", state: "", pincode: "", landmark: "" });
        setShowAddressForm(true);
    };

    const labelIcon = (label: AddressLabel) => {
        switch (label) {
            case "HOME": return <Home className="h-4 w-4" />;
            case "WORK": return <Briefcase className="h-4 w-4" />;
            default: return <MapPin className="h-4 w-4" />;
        }
    };

    const genderOptions: { value: Gender; label: string }[] = [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
        { value: "OTHER", label: "Other" },
    ];

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Edit Profile</h1>
            </div>

            {/* Profile Avatar */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                        {user?.name?.charAt(0) || "U"}
                    </div>
                    <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                        <Camera className="h-3.5 w-3.5" />
                    </button>
                </div>
                <p className="text-sm text-muted-foreground">Tap to change photo</p>
            </div>

            {/* Personal Info Section */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Personal Information</h2>
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded text-sm">{error}</div>
                            )}
                            {success && (
                                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded text-sm flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Profile updated
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name *</label>
                                <Input placeholder="Enter your full name" {...register("name")} />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email *</label>
                                <Input type="email" placeholder="Enter your email" {...register("email")} />
                                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone *</label>
                                <Input type="tel" placeholder="Enter your phone number" {...register("phone")} />
                                {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Date of Birth</label>
                                <Input type="date" {...register("dateOfBirth")} />
                            </div>

                            {/* Gender as Radio Pills */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Gender</label>
                                <div className="flex gap-2">
                                    {genderOptions.map((g) => (
                                        <button
                                            key={g.value}
                                            type="button"
                                            onClick={() => setSelectedGender(selectedGender === g.value ? "" : g.value)}
                                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all
                                                ${selectedGender === g.value
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button className="w-full" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <LoadingSpinner size="sm" /> : "Save Profile"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Addresses Section */}
            <div id="addresses">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Saved Addresses</h2>
                    {!showAddressForm && (
                        <Button size="sm" variant="outline" onClick={() => setShowLocationDialog(true)}>
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    )}
                </div>

                {/* Address Form */}
                {showAddressForm && (
                    <Card className="mb-4">
                        <CardContent className="pt-6">
                            <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Label</label>
                                    <div className="flex gap-2">
                                        {(["HOME", "WORK", "OTHER"] as const).map((l) => (
                                            <button
                                                key={l}
                                                type="button"
                                                onClick={() => addressForm.setValue("label", l)}
                                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5
                                                    ${addressForm.watch("label") === l
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}
                                            >
                                                {l === "HOME" ? <Home className="h-3.5 w-3.5" /> : l === "WORK" ? <Briefcase className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Street Address *</label>
                                    <Input placeholder="House no., Building, Street" {...addressForm.register("street")} />
                                    {addressForm.formState.errors.street && <span className="text-red-500 text-xs">{addressForm.formState.errors.street.message}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">City *</label>
                                        <Input placeholder="City" {...addressForm.register("city")} />
                                        {addressForm.formState.errors.city && <span className="text-red-500 text-xs">{addressForm.formState.errors.city.message}</span>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">State *</label>
                                        <Input placeholder="State" {...addressForm.register("state")} />
                                        {addressForm.formState.errors.state && <span className="text-red-500 text-xs">{addressForm.formState.errors.state.message}</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Pincode *</label>
                                        <Input placeholder="6-digit pincode" maxLength={6} {...addressForm.register("pincode")} />
                                        {addressForm.formState.errors.pincode && <span className="text-red-500 text-xs">{addressForm.formState.errors.pincode.message}</span>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Landmark</label>
                                        <Input placeholder="Nearby landmark" {...addressForm.register("landmark")} />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <Button type="submit" disabled={savingAddress} className="flex-1">
                                        {savingAddress ? <LoadingSpinner size="sm" /> : editingAddressId ? "Update" : "Save Address"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Address List */}
                {addresses.length === 0 && !showAddressForm ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No addresses yet</p>
                            <p className="text-xs mt-1">Add an address to speed up booking</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {addresses.map((addr) => (
                            <Card key={addr._id} className={addr.isDefault ? "border-primary shadow-sm" : ""}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                                {labelIcon(addr.label)}
                                            </div>
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-medium">{addr.label}</span>
                                                    {addr.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Default</span>}
                                                </div>
                                                <p className="text-muted-foreground">{addr.street}</p>
                                                <p className="text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                {addr.landmark && <p className="text-muted-foreground text-xs">Near: {addr.landmark}</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditAddress(addr)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            {!addr.isDefault && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDefault(addr._id!)}>
                                                    <Check className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => deleteAddress(addr._id!)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Location Dialog */}
            <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Address</DialogTitle>
                        <DialogDescription>How would you like to add this address?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={useDeviceLocation}
                            disabled={locationLoading}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                {locationLoading ? <LoadingSpinner size="sm" /> : <MapPin className="h-6 w-6 text-primary" />}
                            </div>
                            <div>
                                <p className="font-medium">Use My Location</p>
                                <p className="text-xs text-muted-foreground">Auto-fill address from GPS</p>
                            </div>
                        </button>
                        <button
                            onClick={() => { setShowLocationDialog(false); openManualAddress(); }}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Pencil className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">Enter Manually</p>
                                <p className="text-xs text-muted-foreground">Type your address details</p>
                            </div>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
