import { ToggleButtonGroup, ToggleButton } from '@mui/material';

const FILTERS = ['All', 'Placement', 'Result', 'Event'];

export function NotificationFilter({ value, onChange }) {
  const handleChange = (_event, newValue) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="Filter notifications by type"
      size="small"
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        width: '100%',
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '14px',
        p: 0.5,
        gap: 0.5,
        '& .MuiToggleButton-root': {
          flex: 1,
          borderRadius: '10px !important',
          border: 'none',
          py: 1,
          px: 2,
          fontSize: '0.85rem',
          fontWeight: 600,
          textTransform: 'none',
          color: 'text.secondary',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          whiteSpace: 'nowrap',
          '&.Mui-selected': {
            bgcolor: 'rgba(99, 102, 241, 0.1)',
            color: '#818cf8',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            '&:hover': {
              bgcolor: 'rgba(99, 102, 241, 0.15)',
            },
          },
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            color: 'text.primary',
          },
        },
      }}
    >
      {FILTERS.map((type) => (
        <ToggleButton key={type} value={type}>
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}