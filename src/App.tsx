import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <WalletProvider>
          <div className="dark min-h-screen bg-background">
            <Routes>
              {routes.map((route, index) => (
                <Route key={index} path={route.path} element={route.element} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(228 18% 10%)',
                border: '1px solid hsl(228 15% 18%)',
                color: 'hsl(210 30% 96%)',
              },
            }}
          />
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
