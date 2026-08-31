import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f4fafd] flex items-center justify-center p-6 text-[#161d1f] font-sans">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-[#c1c8c2] shadow-xl p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-[#F0F9F4] text-[#0e6c4a] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#a0f4c8]">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            
            <h2 className="font-headline text-2xl font-bold text-[#012d1d] mb-2">
              Panel Recuperado con Éxito
            </h2>
            
            <p className="text-sm text-[#414844] mb-6 leading-relaxed">
              Ocurrió una interrupción temporal. La aplicación ha protegido los datos y está lista para continuar.
            </p>

            {this.state.error && (
              <div className="bg-[#eef5f7] rounded-lg p-3 text-left mb-6 text-xs font-mono text-[#012d1d] overflow-x-auto border border-[#c1c8c2]/60 max-h-28">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto bg-[#012d1d] hover:bg-[#1b4332] text-white px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span>Continuar Trabajando</span>
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto bg-[#e8f5ee] hover:bg-[#d4ede0] text-[#012d1d] border border-[#9ed4b6] px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Recargar Vista</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

