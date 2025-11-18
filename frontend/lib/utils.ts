import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn-vue 스타일 병합 유틸리티
 * Tailwind CSS 클래스를 효율적으로 병합
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
