'use client';

import Box from '@mui/material/Box';

/**
 * CSS grid layout without MUI Grid negative-margin offset.
 * Keeps all dashboard sections flush with parent container edges.
 */
export default function DashboardGrid({
  children,
  columns = { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
  gap = 2,
  sx = {},
  ...rest
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        m: 0,
        gap,
        gridTemplateColumns: {
          xs: columns.xs || '1fr',
          sm: columns.sm || columns.xs || '1fr',
          md: columns.md || columns.sm || '1fr',
          lg: columns.lg || columns.md || columns.sm || '1fr',
          xl: columns.xl || columns.lg || columns.md || columns.sm || '1fr'
        },
        alignItems: 'stretch',
        ...sx
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}

export function DashboardGridItem({ children, span, sx = {}, ...rest }) {
  const colSpan =
    typeof span === 'object'
      ? {
          xs: span.xs,
          sm: span.sm,
          md: span.md,
          lg: span.lg,
          xl: span.xl
        }
      : span
        ? { xs: span }
        : undefined;

  return (
    <Box
      sx={{
        minWidth: 0,
        width: '100%',
        height: '100%',
        ...(colSpan
          ? {
              gridColumn: {
                xs: colSpan.xs ? `span ${colSpan.xs}` : undefined,
                sm: colSpan.sm ? `span ${colSpan.sm}` : undefined,
                md: colSpan.md ? `span ${colSpan.md}` : undefined,
                lg: colSpan.lg ? `span ${colSpan.lg}` : undefined,
                xl: colSpan.xl ? `span ${colSpan.xl}` : undefined
              }
            }
          : null),
        ...sx
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}
