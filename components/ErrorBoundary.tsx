"use client";

import React from "react";

interface State {
  error: Error | null;
}

// Safety net: if anything crashes during render, show a clear message with
// a way to recover instead of a silently frozen/blank screen.
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Wander crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg px-8 text-center text-white">
          <p className="text-lg font-semibold">Something went wrong.</p>
          <p className="max-w-xs text-sm text-secondary">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
