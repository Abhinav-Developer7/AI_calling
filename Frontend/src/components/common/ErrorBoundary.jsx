import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Structured error logging
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-surface rounded-xl border border-border-subtle shadow-sm text-center font-sans">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h2 className="text-sm font-semibold text-content-primary mb-1">
            Section Error Encountered
          </h2>
          <p className="text-xs text-content-muted mb-4 leading-relaxed">
            An unexpected error occurred while rendering this view.
          </p>
          <button
            onClick={this.handleReload}
            className="px-3.5 py-1.5 rounded-lg bg-gold hover:bg-gold-hover text-slate-950 font-semibold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

