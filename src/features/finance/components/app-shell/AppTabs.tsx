interface TabItem {
  id: string;
  labelKey: string;
}

interface AppTabsProps {
  tabs: TabItem[];
  activeTab: string;
  translate: (key: string) => string;
  onChange: (tabId: string) => void;
}

export function AppTabs({ tabs, activeTab, translate, onChange }: AppTabsProps) {
  return (
    <nav className="app-tabs" role="tablist" aria-label="Secoes do aplicativo">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`app-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {translate(tab.labelKey)}
        </button>
      ))}
    </nav>
  );
}
