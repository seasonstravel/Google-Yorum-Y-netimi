import { TaskStatus } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PUBLISHED: return 'bg-green-100 text-green-800 border-green-200';
    case TaskStatus.SPAM_DELETED: return 'bg-red-100 text-red-800 border-red-200';
    case TaskStatus.PENDING_REVIEW: return 'bg-orange-100 text-orange-800 border-orange-200';
    case TaskStatus.ASSIGNED: return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.PUBLISHED: return 'Yayında (+1)';
    case TaskStatus.SPAM_DELETED: return 'Silindi/Spam (-1)';
    case TaskStatus.PENDING_REVIEW: return 'İncelemede';
    case TaskStatus.ASSIGNED: return 'Atandı';
    default: return status;
  }
};

export const createWhatsAppLink = (phone: string, message: string) => {
    // Remove non-numeric chars
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export interface UserLevel {
  name: string;
  color: string;
  icon: string; // Emoji
  minPoints: number;
}

export const getUserLevel = (points: number): UserLevel => {
  if (points >= 100) return { name: 'Elit', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '💎', minPoints: 100 };
  if (points >= 50) return { name: 'Uzman', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '👑', minPoints: 50 };
  if (points >= 20) return { name: 'Deneyimli', color: 'bg-green-100 text-green-800 border-green-200', icon: '🌟', minPoints: 20 };
  return { name: 'Acemi', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '🌱', minPoints: 0 };
};