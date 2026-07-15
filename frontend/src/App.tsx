import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const SessionPage = lazy(() => import('./pages/SessionPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function LoadingScreen(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-dvh bg-abyss">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-[3px] border-iron border-t-amber rounded-full animate-spin" />
        <p className="font-heading text-parchment text-sm tracking-widest uppercase animate-pulse">
          Завантаження...
        </p>
      </div>
    </div>
  );
}

export function App(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/session/:roomId" element={<SessionPage />} />
        <Route path="/" element={<Navigate to="/lobby" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
