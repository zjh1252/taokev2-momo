// 通用格式化工具

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN');
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
