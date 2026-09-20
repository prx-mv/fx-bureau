import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('agy_institutional_theme') || 'institutional-dark';
    } catch {
      return 'institutional-dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('agy_institutional_theme', theme);
  }, [theme]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#090b0e',
        color: '#eef1f5',
        display: 'flex',
      }}
    >
      <Dashboard />
    </div>
  );
}
