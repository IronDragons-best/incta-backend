export type SortOrder = 'ASC' | 'DESC';

export function toSafeNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) || num <= 0 ? defaultValue : num;
}

export function parseOrder(order: string | undefined): SortOrder {
  return order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

export function pickSortField(
  field: string | undefined,
  allowedFields: string[],
  defaultField: string,
): string {
  if (!field) return defaultField;
  return allowedFields.includes(field) ? field : defaultField;
}
