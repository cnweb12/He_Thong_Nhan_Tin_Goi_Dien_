import React from 'react';

/**
 * ErrorBoundary toàn cục — bắt bất kỳ uncaught error nào trong component tree,
 * hiển thị fallback UI thay vì crash trắng trang.
 *
 * Sử dụng trong App.jsx:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0e1621] px-4">
          <div className="bg-white dark:bg-[#17212b] border border-slate-200 dark:border-[#1e2d3d] rounded-2xl px-8 py-8 text-center shadow-lg max-w-md w-full">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              Đã xảy ra lỗi không mong muốn
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {this.state.error?.message || 'Một lỗi không xác định đã xảy ra. Vui lòng tải lại trang.'}
            </p>
            <button
              type="button"
              onClick={() => this.handleReset()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-medium text-sm"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
