import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface PageErrorProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

export function PageError({ title = "Something went wrong", message, onRetry }: PageErrorProps) {
    return (
        <div className="flex items-center justify-center py-20">
            <Card className="w-full max-w-md">
                <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                    <h3 className="font-bold mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{message}</p>
                    {onRetry && (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                            <RefreshCw className="h-4 w-4 mr-1" /> Retry
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
