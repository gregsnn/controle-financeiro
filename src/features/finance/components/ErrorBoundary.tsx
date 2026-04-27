import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: '#fafafa',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 500, margin: 0, color: '#1a1a1a' }}>
            Algo deu errado
          </h1>
          <p style={{ color: '#666', maxWidth: '400px', lineHeight: 1.5 }}>
            Encontramos um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Recarregar página
          </button>
          {this.state.error && (
            <details
              style={{ marginTop: '1.5rem', textAlign: 'left', width: '100%', maxWidth: '500px' }}
            >
              <summary style={{ cursor: 'pointer', color: '#666', fontSize: '0.75rem' }}>
                Detalhes do erro
              </summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  color: '#d32f2f',
                }}
              >
                {this.state.error?.message || String(this.state.error)}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: ErrorBoundaryProps): React.ReactElement {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}
