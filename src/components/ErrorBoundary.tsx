import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

type ErrorBoundaryState = {
  hasError: boolean
  error?: Error
}

type ErrorBoundaryProps = {
  children: React.ReactNode
  onReset?: () => void
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Uncaught error', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-nb-gray p-6">
          <div className="bg-white border-4 border-black shadow-nb max-w-lg w-full p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500" strokeWidth={3} />
            <h1 className="text-3xl font-black uppercase">Something went wrong</h1>
            <p className="text-sm text-gray-600">
              {this.state.error?.message ??
                'An unexpected error occurred. Please try again or reload the page.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                className="nb-button bg-white"
                onClick={this.handleReset}
              >
                <RefreshCw className="inline-block mr-2" size={16} />
                Try Again
              </button>
              <button
                type="button"
                className="nb-button bg-nb-orange"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
