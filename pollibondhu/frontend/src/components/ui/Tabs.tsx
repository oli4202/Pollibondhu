import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn('flex overflow-x-auto gap-1 border-b border-earth-200 scrollbar-hide', className)}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'whitespace-nowrap flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px',
            activeTab === tab.id
              ? 'border-polli-600 text-polli-700 bg-polli-50/50'
              : 'border-transparent text-earth-500 hover:text-earth-700 hover:bg-earth-50'
          )}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-1 rounded-full bg-polli-100 px-2 py-0.5 text-xs font-bold text-polli-700">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  activeTab: string;
  tabId: string;
  children: ReactNode;
}

export function TabPanel({ activeTab, tabId, children }: TabPanelProps) {
  if (activeTab !== tabId) return null;
  return (
    <div role="tabpanel" className="animate-fade-in">
      {children}
    </div>
  );
}
