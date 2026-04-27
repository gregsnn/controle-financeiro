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
        <FinanceProvider>
          <App />
        </FinanceProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
