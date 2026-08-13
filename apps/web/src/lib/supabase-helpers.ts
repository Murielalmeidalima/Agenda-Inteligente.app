export const isSchemaCacheError = (error: any): boolean =>
  error?.code === 'PGRST204' ||
  error?.code === 'PGRST205' ||
  error?.code === '42703' ||
  error?.code === '42P01';
