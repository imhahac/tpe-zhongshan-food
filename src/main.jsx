import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>⚠️ 頁面載入遇到問題 (App Encountered an Issue)</h2>
          <p>請重新整理頁面，或清除瀏覽器快取紀錄。</p>
          {this.state.error && (
            <details style={{ textAlign: 'left', margin: '20px auto', maxWidth: '600px', background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>查看詳細錯誤資訊 (Error Details)</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem', color: '#d32f2f' }}>
                {this.state.error.toString()}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', marginTop: '10px' }}
          >
            重置並重新整理 (Reset & Reload)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
