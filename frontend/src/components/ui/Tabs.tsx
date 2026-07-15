import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps): React.ReactElement {
  return (
    <div className="flex border-b border-border-default overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
            'transition-all duration-[var(--transition-fast)] cursor-pointer',
            'border-b-2 -mb-px',
            activeTab === tab.id
              ? 'border-amber text-amber'
              : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-accent',
          ].join(' ')}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Convenience wrapper for tab content panels */
export function TabPanel({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}): React.ReactElement | null {
  if (!isActive) return null;
  return <div className="animate-fade-in">{children}</div>;
}
