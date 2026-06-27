import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

const TYPE_COLORS = {
  Placement: { label: 'Placement', color: '#2a9d8f', emoji: '💼' },
  Result: { label: 'Result', color: '#e76f51', emoji: '📄' },
  Event: { label: 'Event', color: '#8b5cf6', emoji: '🎉' },
};

/**
 * Displays a single notification card styled with Material UI components.
 */
export function NotificationCard({ notification }) {
  const { title, message, type, isRead, createdAt } = notification;
  const config = TYPE_COLORS[type] || { label: type, color: '#6c8ef5', emoji: '🔔' };

  const date = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: (theme) => `0 6px 24px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.05)'}`,
          borderColor: 'primary.main',
        },
        borderLeft: isRead ? '1px solid' : '3px solid',
        borderLeftColor: isRead ? 'divider' : 'primary.main',
        bgcolor: 'background.paper',
        borderRadius: 2,
      }}
    >
      {!isRead && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            boxShadow: '0 0 6px #6c8ef5',
          }}
          aria-label="Unread"
        />
      )}
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1,
          }}
        >
          <Chip
            label={`${config.emoji} ${config.label}`}
            size="small"
            sx={{
              bgcolor: config.color,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              height: 24,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {date}
          </Typography>
        </Box>
        <Typography variant="subtitle1" fontWeight={600} color="text.primary" gutterBottom sx={{ pr: 3, lineHeight: 1.35 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
}
