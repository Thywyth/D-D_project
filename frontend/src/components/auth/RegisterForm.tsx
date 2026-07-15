import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

export function RegisterForm({
  onSwitch,
}: {
  onSwitch: () => void;
}): React.ReactElement {
  const register = useAuthStore((s) => s.register);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (username.length < 3) e.username = "Мін. 3 символи";
    if (!/\S+@\S+\.\S+/.test(email)) e.email = "Невірна адреса";
    if (password.length < 6) e.password = "Мін. 6 символів";
    if (password !== confirmPassword) e.confirm = "Паролі не збігаються";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      await register(username, email, password);
      showToast('Акаунт створено! Ласкаво просимо!', 'success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Помилка реєстрації.';
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="font-heading text-2xl text-parchment mb-1">Реєстрація</h2>
        <p className="text-sm text-text-muted">
          Почни свою пригоду в світі D&amp;D
        </p>
      </div>

      <Input
        label="Ім'я героя"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Аратон Мудрий"
        icon={<span>👤</span>}
        error={errors.username}
        required
        autoComplete="username"
      />

      <Input
        label="Електронна пошта"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="hero@dungeon.ua"
        icon={<span>📧</span>}
        error={errors.email}
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
        error={errors.password}
        required
        autoComplete="new-password"
      />

      <Input
        label="Підтвердіть пароль"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
        icon={<span>🔒</span>}
        error={errors.confirm}
        required
        autoComplete="new-password"
      />

      {errors.submit && (
        <p className="text-xs text-blood text-center">⚠ {errors.submit}</p>
      )}

      <Button type="submit" isLoading={isLoading} fullWidth size="lg">
        Створити акаунт
      </Button>

      <p className="text-center text-sm text-text-muted">
        Вже є акаунт?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-amber hover:text-amber-glow font-medium transition-colors cursor-pointer"
        >
          Увійти
        </button>
      </p>
    </form>
  );
}
