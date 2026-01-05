export const mean = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const stdDev = (values: number[]) => {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
};

export const min = (values: number[]) =>
  values.length ? Math.min(...values) : 0;

export const max = (values: number[]) =>
  values.length ? Math.max(...values) : 0;
