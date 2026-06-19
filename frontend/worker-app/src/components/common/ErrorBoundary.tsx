import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (import.meta.env.DEV) {
            console.error("ErrorBoundary caught:", error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex items-center justify-center min-h-[400px] p-4">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                {this.state.error?.message || "An unexpected error occurred."}
                            </p>
                            <Button onClick={this.handleReset}>Try Again</Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        return this.props.children;
    }
}
