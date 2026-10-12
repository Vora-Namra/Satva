import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-panel">
          <h1>Something went wrong</h1>
          <p>Please refresh the page or try again after a moment.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
