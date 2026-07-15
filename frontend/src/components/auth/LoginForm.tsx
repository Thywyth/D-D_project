import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

export function LoginForm({
  onSwitch,
}: {
  onSwitch: () => void;
}): React.ReactElement {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      showToast('Ласкаво просимо назад!', 'success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Помилка входу. Перевірте дані.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="font-heading text-2xl text-parchment mb-1">Увійти</h2>
        <p className="text-sm text-text-muted">
          Повернись до свого походу, мандрівнику
        </p>
      </div>

      <Input
        label="Електронна пошта"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="hero@dungeon.ua"
        icon={<span>📧</span>}
        required
        autoComplete="email"
      />

      <Input
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        icon={<span>🔒</span>}
        error={error}
        required
        autoComplete="current-password"
      />

      <Button type="submit" isLoading={isLoading} fullWidth size="lg">
        Увійти
      </Button>

      <p className="text-center text-sm text-text-muted">
        Немає акаунту?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-amber hover:text-amber-glow font-medium transition-colors cursor-pointer"
        >
          Створити
        </button>
      </p>
    </form>
  );
}
