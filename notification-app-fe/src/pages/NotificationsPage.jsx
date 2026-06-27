import {
  Container,
  Box,
  Typography,
  Badge,
  Divider,
  CircularProgress,
  Alert,
  Pagination,
  Stack
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InboxIcon from '@mui/icons-material/Inbox';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationFilter } from '../components/NotificationFilter';
import { PriorityInbox } from '../components/PriorityInbox';

/**
 * NotificationsPage component rendered using Material UI components only.
 * Houses the Priority Inbox, category filters, notification cards list, and pagination.
 */
export function NotificationsPage() {
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
    setPage(1); // reset to first page on filter change
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 32, color: 'text.primary' }} />
        </Badge>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Notifications
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {total} notification{total !== 1 ? 's' : ''} found
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      <PriorityInbox />

      <Box sx={{ mb: 2.5 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      <Box role="region" aria-live="polite" sx={{ minHeight: 200, display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={2}>
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
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={1} color="text.secondary">
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

      {!loading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
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
