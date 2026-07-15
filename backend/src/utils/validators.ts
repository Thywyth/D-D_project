/**
 * Input Validation Utilities
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): string | null {
  if (password.length < 6) {
    return 'Пароль має містити мінімум 6 символів.';
  }
  if (password.length > 128) {
    return 'Пароль має містити максимум 128 символів.';
  }
  return null;
}

export function isValidUsername(username: string): string | null {
  if (username.length < 2) {
    return "Ім'я має містити мінімум 2 символи.";
  }
  if (username.length > 30) {
    return "Ім'я має містити максимум 30 символів.";
  }
  return null;
}

export function isValidRoomName(name: string): string | null {
  if (name.length < 2) {
    return 'Назва кімнати має містити мінімум 2 символи.';
  }
  if (name.length > 60) {
    return 'Назва кімнати має містити максимум 60 символів.';
  }
  return null;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export function sanitizeString(value: string): string {
  return value.trim();
}
