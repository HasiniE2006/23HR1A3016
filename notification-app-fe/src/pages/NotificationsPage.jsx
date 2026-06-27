import {
  Container,
  Box,
  Typography,
  Badge,
  Divider,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InboxIcon from '@mui/icons-material/Inbox';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationFilter } from '../components/NotificationFilter';
import { PriorityInbox } from '../components/PriorityInbox';

/**
 * NotificationsPage — all layout props moved inside sx={{}} for MUI v9 compat.
 * onClearToken: called when user wants to change their API token.
 */
export function NotificationsPage({ onClearToken }) {
  const {
    notifications,
    total,
    totalPages,
    loading,
    error,
    filter,
    setFilter,
    page,
    setPage,
  } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      {/* ── Header ── */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4,
          bgcolor: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          p: 2,
          borderRadius: '16px',
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="primary" 
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              fontWeight: 800,
              height: 18,
              minWidth: 18,
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: '12px',
              bgcolor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <NotificationsIcon sx={{ fontSize: 22, color: '#818cf8' }} />
          </Box>
        </Badge>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
            Notification Hub
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {total} alert{total !== 1 ? 's' : ''} retrieved from server
          </Typography>
        </Box>
        {onClearToken && (
          <Tooltip title="Configure API Access Token">
            <IconButton
              id="change-token-btn"
              size="medium"
              onClick={onClearToken}
              sx={{ 
                color: 'text.secondary', 
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px',
                p: 1,
                '&:hover': { 
                  color: 'primary.main',
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                } 
              }}
              aria-label="Change API token"
            >
              <VpnKeyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── Priority Inbox ── */}
      <PriorityInbox />

      {/* ── Filter bar ── */}
      <Box sx={{ mb: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {/* ── Notification list ── */}
      <Box
        role="region"
        aria-live="polite"
        sx={{ minHeight: 200, display: 'flex', flexDirection: 'column' }}
      >
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 2,
            }}
          >
            <CircularProgress size={28} sx={{ color: 'primary.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Retrieving updates…
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              bgcolor: 'rgba(239, 68, 68, 0.03)',
            }}
          >
            Failed to load notifications: {error}
          </Alert>
        )}

        {!loading && !error && notifications.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 10,
              gap: 2,
              bgcolor: 'rgba(255, 255, 255, 0.01)',
              border: '1px dashed rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
            }}
          >
            <InboxIcon sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.3 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Your feed is up to date.
            </Typography>
          </Box>
        )}

        {!loading && !error && (
          <Stack spacing={2}>
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </Stack>
        )}
      </Box>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="medium"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: '10px',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.03)',
                bgcolor: 'rgba(255,255,255,0.01)',
                '&.Mui-selected': {
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.25)',
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                }
              }
            }}
          />
        </Box>
      )}
    </Container>
  );
}
