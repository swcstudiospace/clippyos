import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppErrorComponent } from "@/lib/error-component";
import { captureClientError } from "@/lib/errors";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureClientError(error, { source: info.componentStack ? "boundary" : "react" });
  }

  render() {
    if (this.state.error) {
      return (
        <AppErrorComponent
          error={this.state.error}
          reset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
