export const PERMISSION_KEYS = [
  { key: 'read', label: 'Read', short: 'R', color: 'info', description: 'Melihat data' },
  { key: 'insert', label: 'Create', short: 'C', color: 'success', description: 'Menambah data' },
  { key: 'update', label: 'Update', short: 'U', color: 'warning', description: 'Mengubah data' },
  { key: 'remove', label: 'Delete', short: 'D', color: 'error', description: 'Menghapus data' },
  { key: 'accept', label: 'Accept', short: 'Ac', color: 'secondary', description: 'Menerima pengajuan' },
  { key: 'validate', label: 'Validate', short: 'V', color: 'primary', description: 'Validasi data' },
  { key: 'approve', label: 'Approve', short: 'Ap', color: 'primary', description: 'Menyetujui data' }
];

export const CRUD_KEYS = ['read', 'insert', 'update', 'remove'];
export const WORKFLOW_KEYS = ['accept', 'validate', 'approve'];

export const defaultAccess = (submenu) => ({
  submenu,
  read: 'N',
  insert: 'N',
  update: 'N',
  remove: 'N',
  accept: 'N',
  validate: 'N',
  approve: 'N'
});

export const countActivePerms = (row) =>
  PERMISSION_KEYS.reduce((n, p) => n + (row?.[p.key] === 'Y' ? 1 : 0), 0);

export const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};
