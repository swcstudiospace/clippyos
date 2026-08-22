import { Component, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/error-state";

type Props = { children: ReactNode; title: string; description?: string };
type State = { error: Error | null };

export class SectionBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-0 flex-1 p-4">
          <ErrorState
            title={`${this.props.title} couldn’t load`}
            description={
              this.props.description ??
              "The rest of this page is still available. Retry this section."
            }
            onRetry={() => this.setState({ error: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
