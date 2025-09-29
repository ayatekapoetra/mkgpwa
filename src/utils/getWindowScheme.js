function getWindowScheme() {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  return mq.matches;
}

export default getWindowScheme;
