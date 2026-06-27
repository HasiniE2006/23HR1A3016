import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { NotificationsPage } from './pages/NotificationsPage';
import { TokenSetup } from './components/TokenSetup';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#07080d',
      paper: '#0f111a',
    },
    primary: {
      main: '#6366f1',
      dark: '#4f46e5',
      light: '#818cf8',
    },
    secondary: {
      main: '#a855f7',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#10b981',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    divider: 'rgba(99, 102, 241, 0.09)',
    action: {
      hover: 'rgba(99, 102, 241, 0.05)',
      selected: 'rgba(99, 102, 241, 0.1)',
    },
  },
  typography: {
    fontFamily: "'Outfit', sans-serif",
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body2: {
      letterSpacing: '0.01em',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0f111a',
          borderColor: 'rgba(99, 102, 241, 0.09)',
          borderRadius: '16px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
        },
      },
    },
  },
});

export default function App() {
  // Check whether a token is already saved in localStorage
  const [hasToken, setHasToken] = useState(() =>
    Boolean(localStorage.getItem('auth_token'))
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {hasToken ? (
        <NotificationsPage
          onClearToken={() => {
            localStorage.removeItem('auth_token');
            setHasToken(false);
          }}
        />
      ) : (
        <TokenSetup onTokenSaved={() => setHasToken(true)} />
      )}
    </ThemeProvider>
  );
}