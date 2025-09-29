import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

export const endpoints = {
  key: 'notification'
};

const initialState = {
  action: false,
  open: false,
  title: 'info',
  message: 'Note archived',
  anchorOrigin: {
    vertical: 'top', // bottom, top
    horizontal: 'right'
  },
  variant: 'border', // outlined, filled, border, ''
  alert: {
    color: 'primary',
    variant: 'filled'
  },
  transition: 'Fade',
  close: false,
  actionButton: false,
  maxStack: 3,
  dense: false,
  iconVariant: 'usedefault'
};

export function useGetNotification() {
  const { data } = useSWR(endpoints.key, () => initialState, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const memoizedValue = useMemo(() => ({ notification: data }), [data]);

  return memoizedValue;
}

export function openNotification(notification) {
  const { title, action, open, message, anchorOrigin, variant, alert, transition, close, actionButton } = notification;

  mutate(
    endpoints.key,
    (currentNotification) => {
      return {
        ...currentNotification,
        title: title || initialState.title,
        action: action || initialState.action,
        open: open || initialState.open,
        message: message || initialState.message,
        anchorOrigin: anchorOrigin || initialState.anchorOrigin,
        variant: variant || initialState.variant,
        alert: {
          color: alert?.color || initialState.alert.color,
          variant: alert?.variant || initialState.alert.variant
        },
        transition: transition || initialState.transition,
        close: close || initialState.close,
        actionButton: actionButton || initialState.actionButton
      };
    },
    false
  );
}

export function closeNotification() {
  // to update local state based on key
  mutate(
    endpoints.key,
    (currentNotification) => {
      return { ...currentNotification, open: false };
    },
    false
  );
}

export function handlerIncrease(maxStack) {
  // to update local state based on key
  mutate(
    endpoints.key,
    (currentNotification) => {
      return { ...currentNotification, maxStack };
    },
    false
  );
}

export function handlerDense(dense) {
  // to update local state based on key
  mutate(
    endpoints.key,
    (currentNotification) => {
      return { ...currentNotification, dense };
    },
    false
  );
}

export function handlerIconVariants(iconVariant) {
  // to update local state based on key
  mutate(
    endpoints.key,
    (currentNotification) => {
      return { ...currentNotification, iconVariant };
    },
    false
  );
}
