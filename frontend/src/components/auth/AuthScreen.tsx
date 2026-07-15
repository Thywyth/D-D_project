import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthScreen(): React.ReactElement {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-void">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Dark gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-void via-charcoal to-slate-dark" />

        {/* Ambient particle effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-96 h-96 -top-48 -left-48 rounded-full bg-amber/10 blur-[100px] animate-pulse" />
          <div className="absolute w-80 h-80 -bottom-40 -right-40 rounded-full bg-arcane/10 blur-[100px] animate-pulse delay-500" />
          <div className="absolute w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-parchment/5 blur-[80px]" />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212,165,116,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,165,116,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber/20 to-gold/10 border-2 border-amber/30 mb-4 shadow-glow-amber">
            <span className="text-4xl">⚔️</span>
          </div>
          <h1 className="font-heading text-3xl text-parchment tracking-wider">
            DnD Mobile VTT
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Віртуальний ігровий стіл
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass rounded-[var(--radius-xl)] border-wood p-6">
          {mode === 'login' ? (
            <LoginForm onSwitch={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitch={() => setMode('login')} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6 opacity-60">
          v1.0 · Збудовано з ❤️ для D&amp;D спільноти
        </p>
      </div>
    </div>
  );
}
