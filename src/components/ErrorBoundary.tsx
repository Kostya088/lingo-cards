import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught rendering error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 border border-rose-200 dark:border-rose-900/50">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
            {this.state.error?.message ||
              "An unexpected error occurred while loading this screen."}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 text-white font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <RefreshCw className="w-5 h-5" />
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
