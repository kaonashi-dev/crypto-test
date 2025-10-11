import { type ClassValue, clsx } from 'clsx';
import type { HTMLAttributes } from 'svelte/elements';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithElementRef<T extends HTMLAttributes<HTMLElement>> = T & {
  ref?: HTMLElement | null;
};

export type WithoutChildren<T extends HTMLAttributes<HTMLElement>> = Omit<T, 'children'>;

export type WithoutChild<T extends HTMLAttributes<HTMLElement>> = Omit<T, 'children'>;

export type WithoutChildrenOrChild<T extends HTMLAttributes<HTMLElement>> = Omit<T, 'children'>;
