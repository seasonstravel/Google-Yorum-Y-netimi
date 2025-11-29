import React from 'react';
import { TaskStatus } from '../types';
import { getStatusColor, getStatusLabel } from '../utils/helpers';
import { clsx } from 'clsx';

interface BadgeProps {
  status: TaskStatus;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  return (
    <span className={clsx(
      "px-2 py-1 text-xs font-medium rounded-full border",
      getStatusColor(status),
      className
    )}>
      {getStatusLabel(status)}
    </span>
  );
};