import React from "react";

export default class ErrorModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Stack trace:", errorInfo?.componentStack);
    this.setState({ error: error?.message || "Unknown error", errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-red-400 text-xl">!</span>
            </div>
            <h2 className="text-white font-black text-lg mb-2">Something went wrong</h2>
            {this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-left overflow-auto max-h-32">
                <p className="text-red-400 text-[10px] font-mono break-words">{this.state.error}</p>
              </div>
            )}
            <p className="text-slate-400 text-xs mb-4">
              {this.state.error?.includes("onUpgrade") 
                ? "A prop is missing. Fix applied — click below to reload."
                : "Refresh to continue"}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition"
            >
              Reload App
            </button>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })} 
              className="w-full mt-2 py-2 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-widest transition"
            >
              Try to Recover (May Crash Again)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
