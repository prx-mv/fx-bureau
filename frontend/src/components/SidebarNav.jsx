import React from 'react';

export default function SidebarNav({
  activeNav = 'Markets',
  onSelectNav = () => {},
  audioEnabled = true,
  onToggleAudio = () => {},
  onOpenAlerts = () => {},
  onOpenRiskSizer = () => {},
}) {
  const navItems = [
    {
      id: 'Markets',
      label: 'Markets',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M18 9l-5 5-4-4-3 3" />
        </svg>
      ),
    },
    {
      id: 'Portfolio',
      label: 'Portfolio',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      id: 'Trade',
      label: 'Trade',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      id: 'Sizer',
      label: 'Sizer',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
        </svg>
      ),
    },
    {
      id: 'Backtest',
      label: 'Backtest',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'Alerts',
      label: 'Alerts',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
  ];

  const handleNavClick = (id) => {
    onSelectNav(id);
    if (id === 'Alerts') onOpenAlerts();
    if (id === 'Sizer') onOpenRiskSizer();
  };

  return (
    <aside
      style={{
        width: '210px',
        backgroundColor: '#0d0f14',
        borderRight: '1px solid #1a1d24',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '18px 12px',
        flexShrink: 0,
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* Top Brand & Navigation */}
      <div>
        {/* FX Bureau Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px 20px 8px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#cbb07a',
              display: 'inline-block',
              boxShadow: '0 0 8px rgba(203, 176, 122, 0.6)',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              color: '#eef1f5',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display)',
            }}
          >
            FX Bureau
          </span>
        </div>

        {/* Nav list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 12px',
                  background: isActive ? '#191c24' : 'transparent',
                  color: isActive ? '#ffffff' : '#7e8794',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#eef1f5';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#7e8794';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom System Channels */}
      <div
        style={{
          borderTop: '1px solid #1a1d24',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: '#cbb07a',
            marginBottom: '4px',
            paddingLeft: '4px',
          }}
        >
          System Channels
        </div>

        {/* Terminal Audio */}
        <button
          onClick={onToggleAudio}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            fontSize: '11px',
            color: audioEnabled ? '#c3cbd6' : '#56606d',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          title={audioEnabled ? 'Terminal Chimes Enabled' : 'Terminal Chimes Muted'}
        >
          <span>• Terminal Audio</span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: audioEnabled ? '#4f9d69' : '#56606d',
            }}
          />
        </button>

        {/* Discord Webhook */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 6px',
            fontSize: '11px',
            color: '#c3cbd6',
          }}
        >
          <span>• Discord Webhook</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4f9d69' }} />
        </div>

        {/* Telegram Push */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 6px',
            fontSize: '11px',
            color: '#c3cbd6',
          }}
        >
          <span>• Telegram Push</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4f9d69' }} />
        </div>
      </div>
    </aside>
  );
}
