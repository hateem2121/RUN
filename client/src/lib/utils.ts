import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number | undefined | null): string {
  // CRITICAL FIX: Handle invalid input values to prevent crashes
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return '0 Bytes';
  }
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Additional safety check for array bounds
  if (i < 0 || i >= sizes.length) {
    return '0 Bytes';
  }
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
