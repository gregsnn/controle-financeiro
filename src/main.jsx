import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './features/finance/components/ErrorBoundary';
import { FinanceProvider } from './features/finance';
import { I18nProvider } from './features/finance/lib/i18n.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
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