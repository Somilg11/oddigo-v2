import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
    message: string;
    className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
    return (
        <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2 ${className}`}>
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{message}</span>
        </div>
    );
}
