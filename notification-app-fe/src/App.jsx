import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { NotificationsPage } from './pages/NotificationsPage';
import { TokenSetup } from './components/TokenSetup';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f1117',
      paper: '#1a1d27',
    },
    primary: {
      main: '#6c8ef5',
      dark: '#4a6be8',
    },
    error: {
      main: '#f05b5b',
    },
    success: {
      main: '#4caf50',
    },
    text: {
      primary: '#e8eaf0',
      secondary: '#7b82a0',
    },
    divider: '#2e3352',
    action: {
      hover: 'rgba(255, 255, 255, 0.05)',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
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