'use client';

import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Formik } from 'formik';
import * as Yup from 'yup';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { APP_DEFAULT_PATH } from 'config';
import {
  createNotification,
  getNotificationAudienceRecipients,
  retryNotification,
  useNotificationAdminAccess,
  useNotificationAudienceOptions,
  useNotificationHistory,
  useNotificationUsers
} from 'api/push-notifications';
import { openNotification } from 'api/notification';
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import MainCard from 'components/MainCard';

const audienceLabels = {
  broadcast: 'All users',
  business: 'Users by business unit',
  branch: 'Users by branch',
  section: 'Users by section',
  personal: 'Selected users'
};
const audienceFields = { business: 'bisnis_id', branch: 'cabang_id', section: 'section' };
const targetLabels = { app_emp: 'Employee app', app_oprdrv: 'Operator/Driver app', web: 'Web', all: 'All applications' };
const initialValues = {
  audience_type: 'broadcast',
  bisnis_id: '',
  cabang_id: '',
  section: '',
  audience_label: '',
  audience_count: '',
  target_app: 'all',
  user_ids: [],
  title: '',
  body: '',
  priority: 'default',
  ttl_seconds: ''
};

const schema = Yup.object({
  audience_type: Yup.string().oneOf(Object.keys(audienceLabels)).required('Audience is required'),
  target_app: Yup.string().oneOf(Object.keys(targetLabels)).required('Target application is required'),
  user_ids: Yup.array().when('audience_type', {
    is: (audienceType) => audienceType !== 'broadcast',
    then: (value) => value.min(1, 'Select at least one recipient'),
    otherwise: (value) => value
  }),
  bisnis_id: Yup.number().transform((value, original) => (original === '' ? null : value)).nullable().when('audience_type', {
    is: 'business',
    then: (value) => value.required('Select a business unit')
  }),
  cabang_id: Yup.number().transform((value, original) => (original === '' ? null : value)).nullable().when('audience_type', {
    is: 'branch',
    then: (value) => value.required('Select a branch')
  }),
  section: Yup.string().when('audience_type', {
    is: 'section',
    then: (value) => value.required('Select a section')
  }),
  title: Yup.string().trim().max(100, 'Maximum 100 characters').required('Title is required'),
  body: Yup.string().trim().max(500, 'Maximum 500 characters').required('Message is required'),
  priority: Yup.string().oneOf(['default', 'high']).required(),
  ttl_seconds: Yup.number().transform((value, original) => (original === '' ? null : value)).nullable().integer('Use whole seconds').positive('Must be greater than zero')
});

const errorMessage = (error, fallback) => error?.message || error?.error || error?.errors?.message || fallback;
const isForbidden = (error) => Number(error?.status || error?.statusCode || error?.code) === 403;
const userId = (user) => user?.uuid || user?.id || user?.user_id;
const userLabel = (user) => user?.name || user?.fullname || user?.username || user?.email || String(userId(user) || 'Unknown user');
const notificationId = (row) => row?.uuid || row?.id;

function canCreate(access) {
  if (access === true) return true;
  return Boolean(access?.permissions?.insert ?? access?.can_create ?? access?.canCreate ?? access?.can_send ?? access?.canSend ?? access?.can_send_notifications ?? access?.allowed);
}

const canRetry = (access) => Boolean(access?.permissions?.update ?? access?.can_update ?? access?.canRetry ?? access?.override);

function channelResults(row) {
  const source = row?.push_result || row?.channel_results || row?.delivery_results || row?.results || row?.channels;
  if (Array.isArray(source)) return source;
  if (source && typeof source === 'object') return Object.entries(source).map(([channel, result]) => ({ channel, ...(typeof result === 'object' ? result : { status: result }) }));
  return [];
}

function ResultSummary({ row }) {
  const results = channelResults(row);
  if (!results.length && row?.target_app === 'web') return <Chip size="small" label={`web: ${row.status || 'completed'}`} color="success" />;
  if (!results.length) return <Typography variant="caption" color="text.secondary">No channel result</Typography>;
  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap">
      {results.map((result, index) => {
        const label = result.channel || result.target || result.name || `Channel ${index + 1}`;
        const status = result.status || (result.accepted ? 'accepted' : result.success ? 'sent' : 'failed');
        return <Chip key={`${label}-${index}`} size="small" label={`${label}: ${status}`} color={['accepted', 'sent', 'success', 'delivered'].includes(String(status).toLowerCase()) ? 'success' : 'default'} />;
      })}
    </Stack>
  );
}

function RecipientSelect({ value, onChange, error, helperText, disabled = false }) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 350);
    return () => clearTimeout(timer);
  }, [input]);
  const { rows, dataLoading } = useNotificationUsers({ query, search: query, page: 1, perPage: 20 }, query.length >= 2);
  const selectedIds = new Set(value.map(userId));
  const options = [...value, ...rows.filter((user) => !selectedIds.has(userId(user)))];

  return (
    <Autocomplete
      multiple
      limitTags={8}
      disabled={disabled}
      filterOptions={(items) => items}
      options={options}
      value={value}
      loading={dataLoading}
      isOptionEqualToValue={(option, selected) => userId(option) === userId(selected)}
      getOptionLabel={userLabel}
      onInputChange={(_, nextValue) => setInput(nextValue)}
      onChange={(_, nextValue) => onChange(nextValue)}
      noOptionsText={query.length < 2 ? 'Type at least 2 characters' : 'No users found'}
      renderInput={(params) => <TextField {...params} label="Recipients" error={error} helperText={helperText || 'Search by name or account'} />}
    />
  );
}

function AudienceOptionSelect({ audienceType, value, onChange, error, helperText }) {
  const { rows, dataLoading, dataError } = useNotificationAudienceOptions(audienceType);
  const selected = rows.find((option) => String(option.value) === String(value)) || null;

  return (
    <Autocomplete
      options={rows}
      value={selected}
      loading={dataLoading}
      isOptionEqualToValue={(option, current) => String(option.value) === String(current.value)}
      getOptionLabel={(option) => option.label || String(option.value || '')}
      onChange={(_, option) => onChange(option)}
      renderOption={(props, option) => (
        <li {...props} key={`${audienceType}-${option.value}`}>
          <Stack width="100%" direction="row" justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="body2">{option.label}</Typography>
              {option.parent_label && <Typography variant="caption" color="text.secondary">{option.parent_label}</Typography>}
            </Box>
            <Chip size="small" label={`${option.recipient_count} users`} />
          </Stack>
        </li>
      )}
      noOptionsText={dataError ? 'Unable to load audience options' : 'No eligible users found'}
      renderInput={(params) => (
        <TextField
          {...params}
          label={audienceType === 'business' ? 'Business unit' : audienceType === 'branch' ? 'Branch' : 'Section'}
          error={error || Boolean(dataError)}
          helperText={helperText || (dataError ? errorMessage(dataError, 'Unable to load options') : 'Only active employees linked to active users are included')}
        />
      )}
    />
  );
}

function OrganizationAudienceField({ audienceType, values, touched, errors, setFieldValue }) {
  const field = audienceFields[audienceType];
  const requestId = useRef(0);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState('');
  useEffect(() => () => {
    requestId.current += 1;
  }, []);

  const selectAudience = async (option) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setFieldValue(field, option?.value || '');
    setFieldValue('audience_label', option?.label || '');
    setFieldValue('audience_count', '');
    setFieldValue('user_ids', []);
    setRecipientsError('');
    if (!option) {
      setRecipientsLoading(false);
      return;
    }

    setRecipientsLoading(true);
    try {
      const recipients = await getNotificationAudienceRecipients({ audience_type: audienceType, [field]: option.value });
      if (requestId.current !== currentRequest) return;
      setFieldValue('user_ids', recipients);
      setFieldValue('audience_count', recipients.length);
    } catch (error) {
      if (requestId.current === currentRequest) setRecipientsError(errorMessage(error, 'Unable to load group recipients'));
    } finally {
      if (requestId.current === currentRequest) setRecipientsLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <AudienceOptionSelect
        audienceType={audienceType}
        value={values[field]}
        onChange={selectAudience}
        error={Boolean(touched[field] && errors[field])}
        helperText={touched[field] && errors[field]}
      />
      {recipientsLoading && <Alert severity="info" icon={<CircularProgress size={18} />}>Loading eligible recipients...</Alert>}
      {recipientsError && <Alert severity="error">{recipientsError}</Alert>}
      <RecipientSelect
        value={values.user_ids}
        onChange={(users) => {
          setFieldValue('user_ids', users);
          setFieldValue('audience_count', users.length);
        }}
        error={Boolean(touched.user_ids && errors.user_ids)}
        helperText={(touched.user_ids && errors.user_ids) || 'Recipients are prefilled from the group and can be edited'}
        disabled={!values[field] || recipientsLoading}
      />
    </Stack>
  );
}

function audienceSummary(row) {
  const label = audienceLabels[row?.audience_type] || row?.audience_type || '-';
  const filter = row?.audience_filter || {};
  const detail = filter.bisnis_id
    ? `Business #${filter.bisnis_id}`
    : filter.cabang_id
      ? `Branch #${filter.cabang_id}`
      : filter.section
        ? filter.section
        : null;
  return detail ? `${label}: ${detail}` : label;
}

export default function PushNotificationsScreen() {
  const { access, dataLoading: accessLoading, dataError: accessError } = useNotificationAdminAccess();
  const [filters, setFilters] = useState({ page: 1, perPage: 10, search: '', status: '' });
  const { rows, total, page, perPage, lastPage, dataLoading, dataError, mutate } = useNotificationHistory(filters);
  const [confirmation, setConfirmation] = useState(null);
  const [result, setResult] = useState(null);
  const [retrying, setRetrying] = useState(null);
  const submissionKey = useRef(uuidv4());
  const submitting = useRef(false);

  const submitConfirmed = async () => {
    if (!confirmation || submitting.current) return;
    submitting.current = true;
    setConfirmation((current) => ({ ...current, loading: true }));
    try {
      const values = confirmation.values;
      const payload = {
        audience_type: values.audience_type,
        target_app: values.target_app,
        title: values.title.trim(),
        body: values.body.trim(),
        priority: values.priority,
        idempotency_key: submissionKey.current
      };
      if (values.audience_type !== 'broadcast') payload.user_ids = values.user_ids.map(userId);
      if (values.audience_type === 'business') payload.bisnis_id = Number(values.bisnis_id);
      if (values.audience_type === 'branch') payload.cabang_id = Number(values.cabang_id);
      if (values.audience_type === 'section') payload.section = values.section;
      if (values.ttl_seconds !== '') payload.ttl_seconds = Number(values.ttl_seconds);
      const response = await createNotification(payload);
      setResult(response);
      setConfirmation(null);
      submissionKey.current = uuidv4();
      confirmation.helpers.resetForm();
      openNotification({ open: true, title: 'success', message: 'Notification submitted', alert: { color: 'success' } });
      await mutate();
    } catch (error) {
      setConfirmation((current) => ({ ...current, loading: false, error: errorMessage(error, 'Unable to send notification') }));
    } finally {
      submitting.current = false;
    }
  };

  const handleRetry = async (uuid) => {
    if (!uuid || retrying) return;
    setRetrying(uuid);
    try {
      const response = await retryNotification(uuid);
      setResult(response);
      openNotification({ open: true, title: 'success', message: 'Retry submitted', alert: { color: 'success' } });
      await mutate();
    } catch (error) {
      openNotification({ open: true, title: 'error', message: errorMessage(error, 'Retry failed'), alert: { color: 'error' } });
    } finally {
      setRetrying(null);
    }
  };

  if (accessLoading) return <Stack alignItems="center" py={8}><CircularProgress /></Stack>;
  if (isForbidden(accessError)) return <Alert severity="error">You do not have access to notification administration.</Alert>;
  if (accessError) return <Alert severity="error">{errorMessage(accessError, 'Unable to check notification access.')}</Alert>;

  return (
    <Stack spacing={2}>
      <Breadcrumbs custom heading="Push Notifications" links={[{ title: 'Home', to: APP_DEFAULT_PATH }, { title: 'Settings' }, { title: 'Push Notifications' }]} />

      {canCreate(access) && (
        <MainCard title="Compose notification">
          <Formik initialValues={initialValues} validationSchema={schema} onSubmit={(values, helpers) => setConfirmation({ values, helpers, loading: false })}>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, isValidating }) => (
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><TextField select fullWidth name="audience_type" label="Audience" value={values.audience_type} onChange={(event) => { handleChange(event); setFieldValue('bisnis_id', ''); setFieldValue('cabang_id', ''); setFieldValue('section', ''); setFieldValue('user_ids', []); setFieldValue('audience_label', ''); setFieldValue('audience_count', ''); }}>{Object.entries(audienceLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
                  <Grid item xs={12} md={6}><TextField select fullWidth name="target_app" label="Target application" value={values.target_app} onChange={handleChange}>{Object.entries(targetLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
                  {audienceFields[values.audience_type] && <Grid item xs={12}><OrganizationAudienceField audienceType={values.audience_type} values={values} touched={touched} errors={errors} setFieldValue={setFieldValue} /></Grid>}
                  {values.audience_type === 'personal' && <Grid item xs={12}><RecipientSelect value={values.user_ids} onChange={(users) => setFieldValue('user_ids', users)} error={Boolean(touched.user_ids && errors.user_ids)} helperText={touched.user_ids && errors.user_ids} /></Grid>}
                  {values.audience_count !== '' && <Grid item xs={12}><Alert severity="info">This audience currently contains <strong>{values.audience_count}</strong> eligible users. The backend recalculates recipients when the notification is sent.</Alert></Grid>}
                  <Grid item xs={12}><TextField fullWidth name="title" label="Title" value={values.title} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.title && errors.title)} helperText={(touched.title && errors.title) || `${values.title.length}/100`} inputProps={{ maxLength: 100 }} /></Grid>
                  <Grid item xs={12}><TextField fullWidth multiline minRows={4} name="body" label="Message" value={values.body} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.body && errors.body)} helperText={(touched.body && errors.body) || `${values.body.length}/500`} inputProps={{ maxLength: 500 }} /></Grid>
                  <Grid item xs={12} md={6}><TextField select fullWidth name="priority" label="Priority" value={values.priority} onChange={handleChange}><MenuItem value="default">Default</MenuItem><MenuItem value="high">High</MenuItem></TextField></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth type="number" name="ttl_seconds" label="TTL (seconds, optional)" value={values.ttl_seconds} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.ttl_seconds && errors.ttl_seconds)} helperText={touched.ttl_seconds && errors.ttl_seconds} inputProps={{ min: 1 }} /></Grid>
                  <Grid item xs={12}><Button type="submit" variant="contained" disabled={isValidating || Boolean(confirmation?.loading)}>Review and send</Button></Grid>
                </Grid>
              </Box>
            )}
          </Formik>
        </MainCard>
      )}

      {result && <Alert severity="success" onClose={() => setResult(null)}><Typography variant="subtitle2">Latest submission result</Typography><ResultSummary row={result} /></Alert>}

      <MainCard title="Notification history">
        <Grid container spacing={1.5} mb={2}>
          <Grid item xs={12} md={7}><TextField fullWidth size="small" label="Search title or message" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} /></Grid>
          <Grid item xs={12} md={5}><TextField select fullWidth size="small" label="Status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}><MenuItem value="">All statuses</MenuItem>{['pending', 'processing', 'completed', 'partial', 'failed'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}</TextField></Grid>
        </Grid>
        {dataLoading ? <Stack alignItems="center" py={5}><CircularProgress /></Stack> : isForbidden(dataError) ? <Alert severity="error">You do not have access to notification history.</Alert> : dataError ? <Alert severity="error">{errorMessage(dataError, 'Unable to load history.')}</Alert> : !rows.length ? <Alert severity="info">No notifications match these filters.</Alert> : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Notification</TableCell><TableCell>Audience</TableCell><TableCell>Target</TableCell><TableCell>Status</TableCell><TableCell>Channel results</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                <TableBody>{rows.map((row) => { const uuid = notificationId(row); return <TableRow key={uuid}><TableCell><Typography variant="subtitle2">{row.title}</Typography><Typography variant="caption" color="text.secondary">{row.created_at || row.createdAt || ''}</Typography></TableCell><TableCell><Typography variant="body2">{audienceSummary(row)}</Typography><Typography variant="caption" color="text.secondary">{row.recipient_count || 0} recipients</Typography></TableCell><TableCell>{targetLabels[row.target_app] || row.target_app || '-'}</TableCell><TableCell><Chip size="small" label={row.status || 'pending'} /></TableCell><TableCell><ResultSummary row={row} /></TableCell><TableCell align="right">{canRetry(access) && ['failed', 'partial'].includes(row.status) ? <Button size="small" onClick={() => handleRetry(uuid)} disabled={retrying === uuid}>{retrying === uuid ? <CircularProgress size={18} /> : 'Retry'}</Button> : '-'}</TableCell></TableRow>; })}</TableBody>
              </Table>
            </TableContainer>
            <Divider sx={{ my: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" gap={1}><Typography variant="caption">{total} total</Typography><Pagination count={lastPage} page={page} onChange={(_, nextPage) => setFilters((current) => ({ ...current, page: nextPage }))} /></Stack>
          </>
        )}
      </MainCard>

      <Dialog open={Boolean(confirmation)} onClose={() => !confirmation?.loading && setConfirmation(null)} fullWidth maxWidth="sm">
        <DialogTitle>Send this notification?</DialogTitle>
        <DialogContent>
          {confirmation?.error && <Alert severity="error" sx={{ mb: 2 }}>{confirmation.error}</Alert>}
          <Stack spacing={1}><Typography variant="subtitle1">{confirmation?.values.title}</Typography><Typography color="text.secondary">{confirmation?.values.body}</Typography><Typography variant="body2"><strong>Audience:</strong> {audienceLabels[confirmation?.values.audience_type]}{confirmation?.values.audience_type === 'personal' ? ` (${confirmation.values.user_ids.length})` : confirmation?.values.audience_label ? ` - ${confirmation.values.audience_label} (${confirmation.values.audience_count} users)` : ''}</Typography><Typography variant="body2"><strong>Target:</strong> {targetLabels[confirmation?.values.target_app]}</Typography></Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setConfirmation(null)} disabled={confirmation?.loading}>Cancel</Button><Button variant="contained" onClick={submitConfirmed} disabled={confirmation?.loading}>{confirmation?.loading ? <CircularProgress size={20} /> : 'Send notification'}</Button></DialogActions>
      </Dialog>
    </Stack>
  );
}
