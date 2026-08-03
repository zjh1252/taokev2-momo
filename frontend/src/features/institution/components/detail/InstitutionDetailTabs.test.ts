import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sourcePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'InstitutionDetailTabs.tsx',
);

describe('InstitutionDetailTabs course tables', () => {
  it('keeps course action cells and links on one line', () => {
    const source = readFileSync(sourcePath, 'utf8');

    expect(source).toContain('px-4 py-3 text-right w-[96px] whitespace-nowrap');
    expect(source).toContain('text-primary hover:underline text-xs whitespace-nowrap');
  });
});
