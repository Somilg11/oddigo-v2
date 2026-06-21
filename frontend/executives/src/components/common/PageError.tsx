import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorProps {
    message: string;
    onRetry?: () => void;
}

export function PageError({ message, onRetry }: PageErrorProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}
