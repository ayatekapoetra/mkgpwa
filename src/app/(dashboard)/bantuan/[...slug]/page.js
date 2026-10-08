import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import MarkdownHelp from 'views/help/MarkdownHelp';

const BANTUAN_DIR = path.join(process.cwd(), 'public', 'bantuan');

function resolveMarkdown(slug) {
  // slug adalah array segmen path, gabungkan dan pastikan selalu berakhiran .md
  const raw = Array.isArray(slug) ? slug.join('/') : String(slug || '');
  const filename = raw.endsWith('.md') ? raw : `${raw}.md`;

  // Cegah path traversal: hanya izinkan nama file aman tanpa separators tambahan
  const safeName = path.basename(filename);
  if (safeName !== filename || !safeName.endsWith('.md')) return null;

  const filePath = path.join(BANTUAN_DIR, safeName);
  if (!filePath.startsWith(BANTUAN_DIR)) return null;

  return { filePath, name: safeName };
}

export default function BantuanPage({ params }) {
  const resolved = resolveMarkdown(params?.slug);
  if (!resolved) notFound();

  let content;
  try {
    content = fs.readFileSync(resolved.filePath, 'utf8');
  } catch (_) {
    notFound();
  }

  const title = resolved.name.replace(/\.md$/, '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return <MarkdownHelp content={content} title={title} />;
}
