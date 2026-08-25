import { CheckCircle, Clock, AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TimelineEvent {
  update_id: number;
  old_status?: string | null;
  new_status?: string | null;
  notes?: string | null;
  is_internal: boolean;
  created_at: string;
  user?: { full_name: string; role?: string } | null;
}

interface ApplicationTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const statusIcons: Record<string, any> = {
  SUBMITTED: FileText,
  REVIEWING: Clock,
  IN_PROGRESS: AlertTriangle,
  APPROVED: CheckCircle,
  REJECTED: AlertTriangle,
  CLOSED: CheckCircle,
  ADDITIONAL_DOCS_REQUIRED: FileText,
  RESUBMITTED: FileText,
};

const statusColours: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-600',
  REVIEWING: 'bg-indigo-100 text-indigo-600',
  IN_PROGRESS: 'bg-sky-100 text-sky-600',
  APPROVED: 'bg-green-100 text-green-600',
  REJECTED: 'bg-red-100 text-red-600',
  CLOSED: 'bg-earth-100 text-earth-500',
  ADDITIONAL_DOCS_REQUIRED: 'bg-amber-100 text-amber-600',
  RESUBMITTED: 'bg-blue-100 text-blue-600',
};

export function ApplicationTimeline({ events, className }: ApplicationTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-earth-400">
        No timeline events yet.
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {events.map((event, index) => {
        const Icon = statusIcons[event.new_status || 'SUBMITTED'] || Clock;
        const colour = statusColours[event.new_status || ''] || 'bg-earth-100 text-earth-500';
        const isFirst = index === 0;
        const isLast = index === events.length - 1;

        return (
          <div key={event.update_id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                isFirst ? colour : 'bg-earth-100 text-earth-400'
              )}>
                <Icon size={16} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-earth-200 my-1" />}
            </div>

            {/* Content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-semibold', isFirst ? 'text-earth-900' : 'text-earth-600')}>
                  {event.new_status?.replace(/_/g, ' ') || 'Status updated'}
                </span>
                {event.user && (
                  <span className="text-xs text-earth-400">by {event.user.full_name}</span>
                )}
              </div>
              {event.notes && !event.is_internal && (
                <p className="text-sm text-earth-500 mt-1">{event.notes}</p>
              )}
              {event.is_internal && (
                <p className="text-xs text-earth-400 italic mt-1">Internal note</p>
              )}
              <time className="text-xs text-earth-400 mt-1 block">
                {new Date(event.created_at).toLocaleString()}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
