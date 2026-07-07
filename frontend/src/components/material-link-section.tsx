'use client';

import { ExternalLink, FileText } from 'lucide-react';

type MaterialLink = {
  url: string;
  fileName: string;
  isPdf: boolean;
};

type MaterialLinkSectionProps = {
  title?: string;
  courseTitle?: string;
  materialUrl?: string | null;
  sourceTexts?: Array<string | null | undefined>;
  emptyText?: string;
  showEmpty?: boolean;
};

const MATERIAL_URL_RE =
  /(?:https?:)?\/\/[^\s"'<>]+?\.(?:pdf|docx?|pptx?)(?:\?[^\s"'<>]*)?|\/[^\s"'<>]+?\.(?:pdf|docx?|pptx?)(?:\?[^\s"'<>]*)?/gi;

function isPdfUrl(url: string) {
  const path = url.split('?')[0].toLowerCase();
  return path.endsWith('.pdf');
}

function normalizeMaterialUrl(raw: string) {
  const value = raw.trim();
  if (!value) return '';
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) {
    const base = process.env.NEXT_PUBLIC_LEGACY_ASSET_BASE_URL || 'https://www.taoke.com';
    return `${base.replace(/\/$/, '')}${value}`;
  }
  return value;
}

function getMaterialFileName(url: string) {
  try {
    const pathname = new URL(url, 'https://taoke.local').pathname;
    const fileName = decodeURIComponent(pathname.split('/').filter(Boolean).pop() || '');
    return fileName || '课程资料';
  } catch {
    return '课程资料';
  }
}

export function resolveMaterialLinks({
  materialUrl,
  sourceTexts = [],
}: Pick<MaterialLinkSectionProps, 'materialUrl' | 'sourceTexts'>): MaterialLink[] {
  const urls = new Set<string>();
  const pushUrl = (raw?: string | null) => {
    const url = normalizeMaterialUrl(raw || '');
    if (url) urls.add(url);
  };

  pushUrl(materialUrl);
  sourceTexts.forEach((text) => {
    if (!text) return;
    const matches = text.matchAll(MATERIAL_URL_RE);
    for (const match of matches) {
      pushUrl(match[0]);
    }
  });

  return Array.from(urls).map((url) => ({
    url,
    fileName: getMaterialFileName(url),
    isPdf: isPdfUrl(url),
  }));
}

export function MaterialLinkSection({
  title = '课程资料',
  courseTitle,
  materialUrl,
  sourceTexts,
  emptyText = '暂无课程资料',
  showEmpty = true,
}: MaterialLinkSectionProps) {
  const materials = resolveMaterialLinks({ materialUrl, sourceTexts });

  if (materials.length === 0 && !showEmpty) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-slate-900">{title}</h2>
      {materials.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <div
              key={material.url}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-primary">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {material.fileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {material.isPdf
                      ? `${courseTitle || title} PDF 资料`
                      : `${courseTitle || title}资料`}
                  </p>
                </div>
              </div>
              <a
                href={material.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-primary px-3 text-sm font-medium text-primary hover:bg-primary/5"
              >
                <ExternalLink className="size-4" />
                <span>{material.isPdf ? '打开 PDF' : '查看资料'}</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
