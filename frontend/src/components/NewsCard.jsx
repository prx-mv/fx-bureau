import React from 'react';

export default function NewsCard({
  headline,
  source,
  time,
  publishedAt,
  sentiment = 'NEUTRAL',
  summary,
  url,
}) {
  const sent = sentiment?.toUpperCase() || 'NEUTRAL';
  let badgeColor = 'var(--text-secondary)';
  let badgeBg = 'rgba(148, 163, 184, 0.1)';

  if (sent === 'BULLISH' || sent === 'POSITIVE') {
    badgeColor = 'var(--accent-green)';
    badgeBg = 'var(--accent-green-bg)';
  } else if (sent === 'BEARISH' || sent === 'NEGATIVE') {
    badgeColor = 'var(--accent-red)';
    badgeBg = 'var(--accent-red-bg)';
  } else if (sent === 'NEUTRAL') {
    badgeColor = 'var(--accent-yellow)';
    badgeBg = 'rgba(245, 158, 11, 0.12)';
  }

  const displayTime = time || (publishedAt ? new Date(publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent');

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '12px',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)' }}>
            {source || 'Wire'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{displayTime}</span>
        </div>

        <span
          style={{
            fontSize: '10px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '12px',
            background: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeColor}30`,
          }}
        >
          {sent}
        </span>
      </div>

      <h4
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: '1.4',
          marginBottom: '6px',
        }}
      >
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'inherit')}
          >
            {headline}
          </a>
        ) : (
          headline
        )}
      </h4>

      {summary && (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {summary}
        </p>
      )}
    </div>
  );
}
