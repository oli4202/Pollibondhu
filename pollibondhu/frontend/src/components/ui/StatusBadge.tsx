import { cn } from '@/utils/cn';

type StatusType =
  | 'SUBMITTED' | 'PENDING' | 'REVIEWING' | 'ASSIGNED' | 'IN_PROGRESS'
  | 'RESOLVED' | 'CLOSED' | 'REJECTED' | 'APPROVED' | 'ACTIVE'
  | 'INACTIVE' | 'PLANNED' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD'
  | 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL'
  | 'NORMAL';

const statusStyles: Record<string, string> = {
  // Application/Complaint status
  SUBMITTED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REVIEWING: 'bg-indigo-100 text-indigo-700',
  ASSIGNED: 'bg-violet-100 text-violet-700',
  IN_PROGRESS: 'bg-sky-100 text-sky-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-earth-100 text-earth-600',
  REJECTED: 'bg-red-100 text-red-700',
  APPROVED: 'bg-green-100 text-green-700',
  
  // General status
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-earth-100 text-earth-500',
  PLANNED: 'bg-slate-100 text-slate-600',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  ON_HOLD: 'bg-amber-100 text-amber-600',
  
  // Priority
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-earth-100 text-earth-600',
  CRITICAL: 'bg-red-600 text-white',
  
  NORMAL: 'bg-earth-100 text-earth-600',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-earth-100 text-earth-600';
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
        style,
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
