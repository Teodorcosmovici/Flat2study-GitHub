import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import { LanguageProvider } from './contexts/LanguageContext'
import { ImpersonationProvider } from './hooks/useImpersonation'

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <AuthProvider>
      <ImpersonationProvider>
        <App />
      </ImpersonationProvider>
    </AuthProvider>
  </LanguageProvider>
);
