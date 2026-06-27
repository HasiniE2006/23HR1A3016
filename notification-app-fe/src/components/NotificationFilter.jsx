import { ToggleButtonGroup, ToggleButton } from '@mui/material';

const FILTERS = ['All', 'Placement', 'Result', 'Event'];

/**
 * Filter row for selecting notification types, styled with Material UI v9.
 * All sx selectors use MUI v9-compatible class names.
 */
export function NotificationFilter({ value, onChange }) {
  const handleChange = (_event, newValue) => {
    // Prevent deselecting the current filter (exclusive mode)
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
        flexWrap: 'wrap',
        gap: 1,
        // In MUI v9 the grouped class selectors changed; target the root directly
        '& .MuiToggleButton-root': {
          borderRadius: '20px !important',
          border: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 0.75,
          textTransform: 'none',
          color: 'text.secondary',
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'white',
            borderColor: 'primary.main',
            boxShadow: '0 0 12px rgba(108, 142, 245, 0.35)',
            '&:hover': { bgcolor: 'primary.dark' },
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