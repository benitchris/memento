import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRWF(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 RWF';
  return `${Math.round(amount).toLocaleString('en-US')} RWF`;
}

export function formatUSD(amountRWF: number, exchangeRate: number = 1380): string {
  if (isNaN(amountRWF) || amountRWF <= 0) return '$0';
  const usd = amountRWF / exchangeRate;
  return `$${usd.toFixed(usd < 10 ? 2 : 0)}`;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function generateBookingRef(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MMT-${year}-${randomStr}`;
}
