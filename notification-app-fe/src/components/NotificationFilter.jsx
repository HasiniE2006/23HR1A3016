import { ToggleButtonGroup, ToggleButton } from '@mui/material';

const FILTERS = ['All', 'Placement', 'Result', 'Event'];

/**
 * Filter row for selecting notification types, styled with Material UI.
 */
export function NotificationFilter({ value, onChange }) {
  const handleChange = (event, newValue) => {
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
      color="primary"
      sx={{
        flexWrap: 'wrap',
        gap: 1,
        border: 'none',
        '& .MuiToggleButtonGroup-grouped': {
          border: '1px solid',
          borderColor: 'divider',
          '&:not(:first-of-type)': {
            borderRadius: 20,
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
          '&:first-of-type': {
            borderRadius: 20,
          },
        },
        '& .MuiToggleButton-root': {
          borderRadius: 20,
          px: 3,
          py: 0.75,
          textTransform: 'none',
          color: 'text.secondary',
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'white',
            borderColor: 'primary.main',
            boxShadow: '0 0 12px rgba(108, 142, 245, 0.35)',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'primary.main',
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