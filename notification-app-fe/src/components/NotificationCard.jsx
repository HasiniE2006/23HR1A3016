import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

const TYPE_CONFIG = {
  Placement: { 
    label: 'Placement', 
    color: '#0ea5e9', 
    bg: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
    border: '#0ea5e9',
    emoji: '💼' 
  },
  Result: { 
    label: 'Result', 
    color: '#f97316', 
    bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)',
    border: '#f97316',
    emoji: '🎓' 
  },
  Event: { 
    label: 'Event', 
    color: '#a855f7', 
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)',
    border: '#a855f7',
    emoji: '🎉' 
  },
};

export function NotificationCard({ notification }) {
  const { title, message, type, isRead, createdAt } = notification;
  const config = TYPE_CONFIG[type] || { 
    label: type, 
    color: '#6366f1', 
    bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
    border: '#6366f1',
    emoji: '🔔' 
  };

  const date = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const time = new Date(createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: isRead ? 'rgba(15, 17, 26, 0.4)' : 'rgba(21, 23, 36, 0.8)',
        backdropFilter: 'blur(10px)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isRead ? 'rgba(255, 255, 255, 0.04)' : 'rgba(99, 102, 241, 0.15)',
        boxShadow: isRead 
          ? 'none' 
          : '0 4px 20px rgba(99, 102, 241, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: isRead 
            ? 'transparent' 
            : `linear-gradient(180deg, ${config.color} 0%, rgba(99, 102, 241, 0.2) 100%)`,
          borderRadius: '4px 0 0 4px',
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: config.color,
          boxShadow: `0 8px 30px rgba(10, 11, 16, 0.5), 0 0 15px ${config.color}15`,
        },
      }}
    >
      {!isRead && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: config.color,
            boxShadow: `0 0 8px ${config.color}`,
            animation: 'pulse 2s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { transform: 'scale(0.95)', opacity: 0.5 },
              '50%': { transform: 'scale(1.2)', opacity: 1, boxShadow: `0 0 12px ${config.color}` },
              '100%': { transform: 'scale(0.95)', opacity: 0.5 },
            }
          }}
          aria-label="Unread"
        />
      )}
      <CardContent sx={{ p: '20px !important' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Chip
            label={`${config.emoji} ${config.label}`}
            size="small"
            sx={{
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.color}30`,
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              height: 22,
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8, fontWeight: 500 }}>
            {date} • {time}
          </Typography>
        </Box>
        <Typography 
          variant="subtitle1" 
          color="text.primary" 
          gutterBottom 
          sx={{ 
            pr: 3, 
            lineHeight: 1.4, 
            fontWeight: 600,
            opacity: isRead ? 0.75 : 1 
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary', 
            lineHeight: 1.6, 
            opacity: isRead ? 0.6 : 0.85 
          }}
        >
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
}
