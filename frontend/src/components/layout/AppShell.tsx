import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSocket } from '../../hooks/useSocket';
import { useSync } from '../../hooks/useSync';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { FAB } from '../ui/FAB';
import { ToastContainer } from '../ui/Toast';
import { DiceOverlay } from '../dice/DiceOverlay';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);

  // Initialize socket connection & sync queue
  useSocket();
  useSync();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex min-h-dvh bg-abyss">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      <BottomNav />
      <FAB onClick={() => setDiceOpen(true)} />
      <DiceOverlay isOpen={diceOpen} onClose={() => setDiceOpen(false)} />
      <ToastContainer />
    </div>
  );
}
