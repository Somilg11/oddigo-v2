import { Wrench } from "lucide-react";

export default function MaintenancePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Wrench className="h-8 w-8 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Under Maintenance</h1>
                <p className="text-muted-foreground">
                    We're currently performing scheduled maintenance. Please try again later.
                </p>
            </div>
        </div>
    );
}
