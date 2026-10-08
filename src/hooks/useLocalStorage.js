import { useCallback, useEffect, useState } from 'react';

// ===========================|| HOOKS - LOCAL STORE ||=========================== //

export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) setValue(JSON.parse(storedValue));
    } catch {
      // ignore parse errors
    }

    const listener = (e) => {
      if (e.storageArea === localStorage && e.key === key) {
        setValue(e.newValue ? JSON.parse(e.newValue) : e.newValue);
      }
    };
    window.addEventListener('storage', listener);

    return () => {
      window.removeEventListener('storage', listener);
    };
  }, [key]);

  const setValueInLocalStorage = useCallback((newValue) => {
    setValue((currentValue) => {
      const result = typeof newValue === 'function' ? newValue(currentValue) : newValue;
      if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(result));
      return result;
    });
  }, [key]);

  return [value, setValueInLocalStorage];
}
