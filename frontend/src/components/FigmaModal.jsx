import React from 'react';

export default function FigmaModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const figmaEmbedUrl = "https://embed.figma.com/design/LC7tczNkl1ZdYdjRIEj8ct/Untitled?node-id=3-61&embed-host=share";
  const figmaDirectUrl = "https://www.figma.com/design/LC7tczNkl1ZdYdjRIEj8ct/Untitled?node-id=3-61";

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: 'var(--hairline)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '1100px',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: 'var(--hairline)',
            background: 'var(--bg-main)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Figma Icon */}
            <svg width="20" height="20" viewBox="0 0 38 57" fill="none">
              <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
              <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
              <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
              <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
              <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
            </svg>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Figma Design Blueprint
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Frame / Node: <code>3-61</code> · Live Interactive Canvas
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href={figmaDirectUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                background: 'var(--bg-card)',
                border: 'var(--hairline)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-blue)',
                fontSize: '11px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open in Figma ↗
            </a>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div style={{ flex: 1, position: 'relative', background: '#1e1e1e' }}>
          <iframe
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            src={figmaEmbedUrl}
            allowFullScreen
            title="Figma Live Canvas"
          />
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: 'var(--hairline)',
            background: 'var(--bg-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            💡 <strong>Tip:</strong> You can zoom, pan, and inspect this live Figma prototype directly inside this window.
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--accent-blue)',
              color: '#0d1117',
              border: 'none',
              padding: '4px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
