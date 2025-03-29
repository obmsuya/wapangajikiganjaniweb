import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}



export function formatPercentage(value: number, precision: number = 2) {
  return (value * 100).toFixed(precision) + '%';
}

export function formatNumber(value: number, precision: number = 2) {
  return value.toFixed(precision);
}
