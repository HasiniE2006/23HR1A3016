import { useState, useEffect } from 'react';
import { fetchPriorityInbox } from '../api/notifications';
import {
  Box,
  Button,
  Collapse,
  Typography,
  List,
  ListItem,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import BoltIcon from '@mui/icons-material/Bolt';

const TYPE_CONFIG = {
  Placement: { color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
  Result: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  Event: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
};

export function PriorityInbox() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPriorityInbox()
      .then((data) => {
        if (!cancelled) setItems(data.notifications ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3,
          bgcolor: 'rgba(245, 158, 11, 0.02)',
          borderRadius: '16px',
          border: '1px dashed rgba(245, 158, 11, 0.2)',
          mb: 3,
        }}
      >
        <CircularProgress size={18} sx={{ mr: 1.5, color: '#f59e0b' }} />
        <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 500, letterSpacing: '0.02em' }}>
          Analyzing Priority Inbox...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>
        Failed to load Priority Inbox: {error}
      </Alert>
    );
  }

  if (items.length === 0) return null;

  return (
    <Box 
      sx={{ 
        border: '1px solid rgba(245, 158, 11, 0.15)', 
        borderRadius: '16px', 
        bgcolor: 'rgba(245, 158, 11, 0.02)', 
        mb: 3.5, 
        overflow: 'hidden',
        boxShadow: '0 4px 30px rgba(245, 158, 11, 0.02)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: 'rgba(245, 158, 11, 0.3)',
          boxShadow: '0 6px 30px rgba(245, 158, 11, 0.04)',
        }
      }}
    >
      <Button
        onClick={() => setOpen((prev) => !prev)}
        fullWidth
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          color: 'text.primary',
          px: 2.5,
          py: 1.75,
          '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.03)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
            }}
          >
            <BoltIcon sx={{ color: '#07080d', fontSize: 18 }} />
          </Box>
          <Typography variant="body1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, letterSpacing: '-0.01em' }}>
            Priority Inbox
            <Chip
              label={`${items.length} unread`}
              size="small"
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 18,
                '& .MuiChip-label': { px: 0.75 }
              }}
            />
          </Typography>
        </Box>
        {open ? (
          <KeyboardArrowUpIcon fontSize="medium" sx={{ color: '#f59e0b' }} />
        ) : (
          <KeyboardArrowDownIcon fontSize="medium" sx={{ color: '#f59e0b' }} />
        )}
      </Button>

      <Collapse in={open}>
        <List sx={{ p: 0, borderTop: '1px solid rgba(245, 158, 11, 0.1)', maxHeight: 320, overflowY: 'auto' }}>
          {items.map((n) => {
            const config = TYPE_CONFIG[n.type] || { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' };
            return (
              <ListItem
                key={n.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2.5,
                  py: 1.5,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                  '&:last-child': { borderBottom: 'none' },
                  transition: 'background-color 0.2s ease',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' }
                }}
              >
                <Chip
                  label={n.type}
                  size="small"
                  sx={{
                    bgcolor: config.bg,
                    color: config.color,
                    border: `1px solid ${config.color}20`,
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    height: 18,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    flexGrow: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                    color: 'text.primary',
                    opacity: 0.9,
                  }}
                >
                  {n.title}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                    height: 18,
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    bgcolor: 'rgba(245, 158, 11, 0.05)',
                  }}
                  title="Priority Score"
                >
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b' }}>
                    {Math.round(n.priorityScore)}
                  </Typography>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
}
