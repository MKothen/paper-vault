import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-nb-yellow flex items-center justify-center p-6">
          <div className="bg-white border-4 border-black shadow-nb p-8 max-w-lg w-full text-center">
            <h1 className="text-3xl font-black uppercase mb-3">Something went wrong</h1>
            <p className="text-sm font-bold text-gray-700 mb-4">
              {this.state.error?.message ?? 'The app hit an unexpected error.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button className="nb-button" onClick={this.handleReset}>
                Try again
              </button>
              <button className="nb-button bg-red-500 text-white" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
