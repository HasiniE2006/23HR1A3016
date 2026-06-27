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

const TYPE_COLORS = {
  Placement: '#2a9d8f',
  Result: '#e76f51',
  Event: '#8b5cf6',
};

/**
 * Collapsible Priority Inbox component displaying top 10 unread notifications.
 * Implements Material UI layout and improves loading/error rendering.
 */
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
      <Box display="flex" justifyContent="center" alignItems="center" py={2.5} bgcolor="background.paper" borderRadius={2} border="1px solid" borderColor="divider" mb={2.5}>
        <CircularProgress size={20} sx={{ mr: 1.5 }} />
        <Typography variant="body2" color="text.secondary">Loading Priority Inbox...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
        Failed to load Priority Inbox: {error}
      </Alert>
    );
  }

  if (items.length === 0) return null;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', mb: 2.5, overflow: 'hidden' }}>
      <Button
        onClick={() => setOpen((prev) => !prev)}
        fullWidth
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          color: 'text.primary',
          px: 2,
          py: 1.25,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <BoltIcon sx={{ color: '#f59e0b', verticalAlign: 'middle' }} />
          <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Priority Inbox
            <Chip
              label={items.length}
              size="small"
              sx={{
                bgcolor: '#f59e0b',
                color: 'black',
                fontWeight: 700,
                height: 18,
                '& .MuiChip-label': { px: 0.75 }
              }}
            />
          </Typography>
        </Box>
        {open ? <KeyboardArrowUpIcon fontSize="small" sx={{ color: 'text.secondary' }} /> : <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
      </Button>

      <Collapse in={open}>
        <List sx={{ p: 0, borderTop: '1px solid', borderColor: 'divider', maxHeight: 320, overflowY: 'auto' }}>
          {items.map((n) => (
            <ListItem
              key={n.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Chip
                label={n.type}
                size="small"
                sx={{
                  bgcolor: TYPE_COLORS[n.type] || 'primary.main',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  flexGrow: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'text.primary'
                }}
              >
                {n.title}
              </Typography>
              <Chip
                label={Math.round(n.priorityScore)}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  height: 20,
                }}
                title="Priority Score"
              />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Box>
  );
}
