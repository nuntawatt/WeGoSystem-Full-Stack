// Silences console output in production builds.
// Note: This doesn't prevent DevTools; it only reduces what is exposed via console.*.

const noop = () => {};

const METHODS: Array<keyof Console> = [
  'log',
  'debug',
  'info',
  'warn',
  'error',
  'table',
  'trace',
  'dir',
  'dirxml',
  'group',
  'groupCollapsed',
  'groupEnd'
];

export function silenceConsoleInProd() {
  if (!import.meta.env.PROD) return;
  for (const method of METHODS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (console as any)[method] = noop;
    } catch {
      // ignore
    }
  }
}
