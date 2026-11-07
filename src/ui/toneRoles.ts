import type { ChordRole } from '../core/chord';

/** 役割 → 色クラス。9/11/13 はまとめて ext 扱い */
export function roleClass(role?: ChordRole): string {
  if (!role) return '';
  if (role === 'R' || role === '3' || role === '5' || role === '7') return `role-${role}`;
  return 'role-ext';
}
