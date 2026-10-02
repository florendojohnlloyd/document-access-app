import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@docuvault.app`;
}

export function emailToUsername(email: string): string {
  return email.replace('@docuvault.app', '').replace('@docaccess.local', '');
}
