import type { MaterialType } from './constants';

export const MAX_BATCH_FILES = 20;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / 1024 / 1024;

export type PendingMaterial = {
  tempId: string;
  file: File;
  name: string;
  category: string;
  scene: string;
  enabled: boolean;
  isDefault: boolean;
};

export function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

export function createPendingMaterial(
  file: File,
  materialType: MaterialType
): PendingMaterial {
  return {
    tempId: crypto.randomUUID(),
    file,
    name: stripExtension(file.name).slice(0, 50),
    category: '其它',
    scene: materialType === 'COVER' ? 'GENERAL' : 'TRAINER',
    enabled: true,
    isDefault: false
  };
}

export function validateImageFiles(files: FileList | File[]): File[] {
  const valid: File[] = [];
  for (const file of Array.from(files)) {
    if (file.size > MAX_FILE_SIZE) {
      continue;
    }
    valid.push(file);
  }
  return valid;
}
