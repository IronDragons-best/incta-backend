export type SortOrder = 'ASC' | 'DESC';

export const parseOrder = (value?: string): SortOrder => {
  if (!value) return 'DESC';
  const normalized = value.toLowerCase();
  return normalized === 'asc' ? 'ASC' : 'DESC';
};

export const pickSortField = (
  candidate: string | string[] | undefined,
  allowed: string[],
  fallback: string,
): string => {
  if (!candidate) return fallback;
  if (Array.isArray(candidate)) {
    const match = candidate.find((field) => allowed.includes(field));
    return match ?? fallback;
  }
  return allowed.includes(candidate) ? candidate : fallback;
};

export const toSafeNumber = (val: string | undefined, defaultVal: number): number => {
  const parsed = Number(val);
  return isNaN(parsed) || parsed <= 0 ? defaultVal : parsed;
};
