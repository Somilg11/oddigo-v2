import { Inbox } from "lucide-react";

interface EmptyStateProps {
    title: string;
    description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    );
}
