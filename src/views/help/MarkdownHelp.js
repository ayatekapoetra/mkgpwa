'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Card, Chip, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { MessageQuestion } from 'iconsax-react';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';
import { APP_DEFAULT_PATH } from 'config';

const headingSx = (level) => ({
  mt: level === 1 ? 0 : 3.5,
  mb: 1.5,
  fontWeight: 800,
  color: 'text.primary',
  scrollMarginTop: 88,
});

const MarkdownComponents = {
  h1: ({ children }) => <Typography variant="h3" sx={headingSx(1)}>{children}</Typography>,
  h2: ({ children }) => <Typography variant="h4" sx={headingSx(2)}>{children}</Typography>,
  h3: ({ children }) => <Typography variant="h5" sx={headingSx(3)}>{children}</Typography>,
  h4: ({ children }) => <Typography variant="h6" sx={headingSx(4)}>{children}</Typography>,
  p: ({ children }) => <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.75 }}>{children}</Typography>,
  strong: ({ children }) => <Typography component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>{children}</Typography>,
  em: ({ children }) => <Typography component="em" sx={{ fontStyle: 'italic' }}>{children}</Typography>,
  a: ({ href, children }) => (
    <Typography component="a" href={href} target="_blank" rel="noopener noreferrer" color="primary.main" sx={{ fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
      {children}
    </Typography>
  ),
  ul: ({ children }) => <Box component="ul" sx={{ pl: 3, mb: 1.5, '& li': { mb: 0.5 } }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" sx={{ pl: 3, mb: 1.5, '& li': { mb: 0.5 } }}>{children}</Box>,
  li: ({ children }) => (
    <Typography component="li" variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      {children}
    </Typography>
  ),
  blockquote: ({ children }) => (
    <Paper variant="outlined" sx={{ my: 2, p: 1.5, pl: 2, borderLeft: 4, borderLeftColor: 'primary.main', bgcolor: 'primary.lighter', borderRadius: 1.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ '& > p': { mb: 0, color: 'text.secondary' } }}>{children}</Typography>
    </Paper>
  ),
  hr: () => <Divider sx={{ my: 3 }} />,
  table: ({ children }) => (
    <TableContainer component={Paper} variant="outlined" sx={{ my: 2, borderRadius: 2, overflow: 'auto' }}>
      <Table size="small">{children}</Table>
    </TableContainer>
  ),
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow sx={{ '&:last-child td': { border: 0 } }}>{children}</TableRow>,
  th: ({ children }) => <TableCell sx={{ fontWeight: 800, color: 'primary.main', bgcolor: 'primary.lighter', whiteSpace: 'nowrap' }}>{children}</TableCell>,
  td: ({ children }) => <TableCell sx={{ color: 'text.secondary' }}>{children}</TableCell>,
  code: ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const value = String(children).replace(/\n$/, '');
    if (inline) {
      return (
        <Typography component="code" sx={{ px: 0.6, py: 0.2, borderRadius: 0.75, bgcolor: 'action.hover', color: 'error.main', fontFamily: 'monospace', fontSize: '0.85em' }}>
          {children}
        </Typography>
      );
    }
    return (
      <Paper variant="outlined" sx={{ my: 2, borderRadius: 1.5, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, py: 0.75, bgcolor: 'secondary.lighter', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {match && match[1] === 'mermaid' ? 'Diagram alur (Mermaid)' : match ? match[1] : 'kode'}
          </Typography>
          {match && match[1] === 'mermaid' && <Chip size="small" label="Mermaid" color="info" variant="outlined" />}
        </Stack>
        <Box component="pre" sx={{ m: 0, p: 1.5, overflowX: 'auto', bgcolor: 'grey.900', color: '#e6edf3', fontSize: 13, lineHeight: 1.6, fontFamily: 'monospace' }}>
          <code>{value}</code>
        </Box>
      </Paper>
    );
  },
  pre: ({ children }) => <>{children}</>,
  img: ({ src, alt }) => <Box component="img" src={src} alt={alt} sx={{ maxWidth: '100%', my: 2, borderRadius: 1.5 }} />,
};

export default function MarkdownHelp({ content, title = 'Bantuan' }) {
  return (
    <>
      <Breadcrumbs custom heading={title} links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Bantuan' }, { title }]} />
      <MainCard
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'primary.lighter' }}>
              <MessageQuestion size={20} />
            </Box>
            <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
          </Stack>
        }
      >
        <Box sx={{ maxWidth: 880, mx: 'auto' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
            {content}
          </ReactMarkdown>
        </Box>
      </MainCard>
    </>
  );
}
