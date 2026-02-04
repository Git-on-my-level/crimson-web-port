export const UI_STYLE = {
  fontFamily: '"Atkinson Hyperlegible", "Trebuchet MS", sans-serif',
  padding: 16,
  buttonHeight: 48,
  buttonWidth: 240,
  colors: {
    primary: '#1e40af',
    primaryHover: '#2563eb',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    background: '#0b0d12',
    backgroundOverlay: 'rgba(15, 23, 42, 0.75)',
  },
  text: {
    title: { fontSize: '48px', color: '#f5f5f5' },
    subtitle: { fontSize: '20px', color: '#9aa4b2' },
    small: { fontSize: '14px', color: '#cbd5f5' },
    button: { fontSize: '18px', color: '#f8fafc' },
    buttonHover: { fontSize: '18px', color: '#f8fafc' },
  },
} as const;

export type UIStyle = typeof UI_STYLE;
