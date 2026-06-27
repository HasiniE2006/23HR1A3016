import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

/**
 * TokenSetup — shown when no auth_token is found in localStorage.
 * The user pastes their evaluation API Bearer token here.
 * Once saved it is stored in localStorage and the main app loads.
 */
export function TokenSetup({ onTokenSaved }) {
  const [value, setValue] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Please paste your Bearer token before continuing.');
      return;
    }
    // Strip "Bearer " prefix if the user pastes the full header value
    const token = trimmed.replace(/^Bearer\s+/i, '');
    localStorage.setItem('auth_token', token);
    onTokenSaved();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        {/* Icon + title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <VpnKeyIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700}>
            API Token Required
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Notification Service needs your evaluation API Bearer token to
          fetch notifications. Paste it below — it will be stored only in your
          browser and never sent anywhere except the local backend proxy.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          id="token-input"
          label="Bearer Token"
          placeholder="Paste your token here…"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          type={showToken ? 'text' : 'password'}
          fullWidth
          multiline={showToken}
          minRows={showToken ? 3 : 1}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowToken((p) => !p)}
                    edge="end"
                    size="small"
                    aria-label={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          id="save-token-btn"
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSave}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
        >
          Save &amp; Load Notifications
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          Get your token from the evaluation portal or course supervisor.
        </Typography>
      </Paper>
    </Box>
  );
}
