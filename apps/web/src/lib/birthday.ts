/**
 * Verifica se o aniversário do cliente é hoje, ou a 1 dia (antes ou depois).
 * Aceita datas no formato ISO (yyyy-MM-dd) ou Date.
 */
export function isClientNearBirthday(
  birthDate?: string | Date | null,
  today: Date = new Date()
): boolean {
  if (!birthDate) return false;

  const bd = typeof birthDate === 'string' ? new Date(birthDate) : new Date(birthDate);
  if (isNaN(bd.getTime())) return false;

  const month = bd.getMonth();
  const day = bd.getDate();

  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);

  const thisYear = new Date(today.getFullYear(), month, day, 12, 0, 0);
  const lastYear = new Date(today.getFullYear() - 1, month, day, 12, 0, 0);
  const nextYear = new Date(today.getFullYear() + 1, month, day, 12, 0, 0);

  const diffDays = (target: Date) =>
    Math.round((target.getTime() - todayMid.getTime()) / 86400000);

  return (
    Math.abs(diffDays(thisYear)) <= 1 ||
    Math.abs(diffDays(lastYear)) <= 1 ||
    Math.abs(diffDays(nextYear)) <= 1
  );
}
