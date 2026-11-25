import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: ErrorBoundaryProps;
  declare setState: (nextState: Partial<ErrorBoundaryState>) => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kesalahan saat memuat halaman.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#242220] flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-sm w-full bg-white border border-[#E8E1D7] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] flex items-center justify-center mx-auto text-[#B89B72]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#1F1D1B] font-medium">
                Halaman Perlu Dimuat Ulang
              </h2>
              <p className="text-xs text-[#70675F] mt-1.5 leading-relaxed">
                Koneksi sempat terganggu atau tampilan mengalami kendala. Silakan muat ulang halaman.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 rounded-xl bg-[#242220] hover:bg-[#383431] text-white text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
