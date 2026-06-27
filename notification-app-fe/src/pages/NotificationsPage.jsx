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
    <Container maxWidth="sm" sx={{ py: 4 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 32, color: 'text.primary' }} />
        </Badge>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Notifications
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {total} notification{total !== 1 ? 's' : ''} found
          </Typography>
        </Box>
        {onClearToken && (
          <Tooltip title="Change API Token">
            <IconButton
              id="change-token-btn"
              size="small"
              onClick={onClearToken}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              aria-label="Change API token"
            >
              <VpnKeyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* ── Priority Inbox ── */}
      <PriorityInbox />

      {/* ── Filter bar ── */}
      <Box sx={{ mb: 2.5 }}>
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
              py: 6,
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading notifications…
            </Typography>
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
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
              py: 6,
              gap: 1,
              color: 'text.secondary',
            }}
          >
            <InboxIcon sx={{ fontSize: 48, opacity: 0.5 }} />
            <Typography variant="body2">No notifications found.</Typography>
          </Box>
        )}

        {!loading && !error && (
          <Stack spacing={1.5}>
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </Stack>
        )}
      </Box>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Box>
      )}
    </Container>
  );
}
