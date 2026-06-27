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
        background: 'radial-gradient(circle at center, #0a0b12 0%, #07080d 100%)',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 460,
          p: 4.5,
          border: '1px solid rgba(99, 102, 241, 0.12)',
          borderRadius: '24px',
          bgcolor: 'rgba(15, 17, 26, 0.7)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
        }}
      >
        {/* Animated Key Icon */}
        <Box 
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
            mb: 3,
          }}
        >
          <VpnKeyIcon sx={{ color: '#ffffff', fontSize: 26 }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em', color: 'text.primary' }}>
          API Token Required
        </Typography>

        <Typography variant="body2" sx={{ mb: 3.5, color: 'text.secondary', lineHeight: 1.6, px: 1 }}>
          Securely link your dashboard to the official evaluation API. Paste your access token below to connect.
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              bgcolor: 'rgba(239, 68, 68, 0.03)',
            }}
          >
            {error}
          </Alert>
        )}

        <TextField
          id="token-input"
          label="Bearer Access Token"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          type={showToken ? 'text' : 'password'}
          fullWidth
          multiline={showToken}
          minRows={showToken ? 3 : 1}
          sx={{ 
            mb: 3.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.06)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(99, 102, 241, 0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            }
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowToken((p) => !p)}
                    edge="end"
                    size="small"
                    aria-label={showToken ? 'Hide token' : 'Show token'}
                    sx={{ color: 'text.secondary' }}
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
          sx={{ 
            py: 1.5,
            borderRadius: '12px', 
            fontWeight: 700, 
            textTransform: 'none',
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.25s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45)',
            }
          }}
        >
          Establish Secure Link
        </Button>

        <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.secondary', opacity: 0.7 }}>
          Generated keys expire periodically and are saved locally.
        </Typography>
      </Paper>
    </Box>
  );
}
