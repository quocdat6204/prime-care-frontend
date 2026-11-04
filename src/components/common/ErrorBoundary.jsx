import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 560,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              padding: 32,
              border: '2px solid #e2e8f0',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
              Đã xảy ra lỗi hiển thị giao diện
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 20px', lineHeight: 1.5 }}>
              Hệ thống đã ghi nhận lỗi. Bạn có thể nhấn nút dưới đây để làm mới trang hoặc quay về trang chủ.
            </p>
            {this.state.error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: 12,
                  color: '#991b1b',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  marginBottom: 20,
                  overflowX: 'auto',
                }}
              >
                <strong>Chi tiết lỗi:</strong> {this.state.error.toString()}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tải lại trang
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

