export function checkIsTauri() {
  if (typeof window === 'undefined') return false;
  
  return !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
}

export async function invokeTauri(command, args = {}) {
  if (!checkIsTauri()) {
    throw new Error('Not running in Tauri environment');
  }
  
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke(command, args);
}
