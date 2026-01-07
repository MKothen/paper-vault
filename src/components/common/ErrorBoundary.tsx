import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '../../domain/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
    // TODO: Send to error reporting service
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isAppError = this.state.error instanceof AppError;
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
                <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-4">
                    {isAppError ? this.state.error?.message : 'An unexpected error occurred.'}
                </p>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    onClick={() => window.location.reload()}
                >
                    Reload Application
                </button>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {this.state.error?.stack}
                    </pre>
                )}
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
