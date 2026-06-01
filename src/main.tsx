import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FinanceProvider } from './features/finance';
import { ErrorBoundary } from './features/finance/components/ErrorBoundary';
import { I18nProvider } from './features/finance/lib/i18n';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider initialLocale="pt-BR">
        <OverlayScrollbarsComponent
          className="app-scroll-shell"
          options={{
            overflow: { x: 'hidden', y: 'scroll' },
            scrollbars: {
              theme: 'os-theme-ios',
              visibility: 'auto',
              autoHide: 'scroll',
              autoHideDelay: 650,
            },
          }}
        >
          <FinanceProvider>
            <App />
          </FinanceProvider>
        </OverlayScrollbarsComponent>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
