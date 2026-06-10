/** C 端展示名：优先授课姓名 teachingName，否则真实姓名 name */
export function getTrainerDisplayName(trainer: {
  name: string;
  teachingName?: string | null;
}): string {
  const teaching = trainer.teachingName?.trim();
  if (teaching) return teaching;
  return trainer.name?.trim() || '';
}
