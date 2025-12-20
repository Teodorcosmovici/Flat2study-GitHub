import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import { LanguageProvider } from './contexts/LanguageContext'
import { ImpersonationProvider } from './hooks/useImpersonation'
import { ThemeProvider } from 'next-themes'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <LanguageProvider>
      <AuthProvider>
        <ImpersonationProvider>
          <App />
        </ImpersonationProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);
