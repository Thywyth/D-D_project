import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function NotFoundPage(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-abyss p-4">
      <div className="text-center animate-fade-in-up">
        <div className="text-7xl mb-4 animate-float">🐉</div>
        <h1 className="font-heading text-4xl text-parchment mb-2">404</h1>
        <p className="text-lg text-text-secondary mb-1">
          Сторінку не знайдено
        </p>
        <p className="text-sm text-text-muted mb-6">
          Здається, ви заблукали в данжені...
        </p>
        <Button onClick={() => navigate('/lobby')} size="lg">
          🏠 Повернутися до лобі
        </Button>
      </div>
    </div>
  );
}
