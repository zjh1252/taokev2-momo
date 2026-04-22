'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Check, Loader2, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  lookupInstitutions,
  type InstitutionLookupItem,
} from '@/features/institution-employee/api/service';

interface InstitutionPickerProps {
  /** 当前选中机构 ID */
  value: number | null;
  /** 选中（或清空）回调；item 为 null 表示清空 */
  onPick: (item: InstitutionLookupItem | null) => void;
}

/**
 * 机构选择器 — 输入机构编号或机构名称模糊匹配，
 * 后端纯数字 keyword 会优先按 ID 精确匹配。
 *
 * <p>如果关键字非空但匹配不到任何机构，会渲染「未检索到该机构，是否注册为培训机构？」
 * 与「去申请培训机构」CTA，跳转 /dashboard/apply/INSTITUTION 申请流程。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 17:00
 */
export default function InstitutionPicker({ value, onPick }: InstitutionPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<InstitutionLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<InstitutionLookupItem | null>(null);
  const [open, setOpen] = useState(false);
  /** 是否已经至少触发过一次搜索（用于决定是否展示「未检索到」CTA） */
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (kw: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await lookupInstitutions(kw, 20);
      setList(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初次加载默认拉一批，便于快速选择
  useEffect(() => {
    search('');
  }, [search]);

  const handlePick = (it: InstitutionLookupItem) => {
    setPicked(it);
    onPick(it);
    setOpen(false);
  };

  if (picked && picked.id === value) {
    return (
      <div className="flex items-center justify-between border border-primary/30 bg-primary/5 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="size-5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">
              {picked.orgName || `机构#${picked.id}`}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {picked.association ? '培训协会 · ' : ''}
              {picked.address || ''}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setPicked(null);
            onPick(null);
            setOpen(true);
          }}
          className="text-xs text-primary hover:underline shrink-0"
        >
          重新选择
        </button>
      </div>
    );
  }

  // 关键字非空 & 已搜索过 & 列表为空 → 显示「未检索到」CTA
  const showEmptyCta =
    open && !loading && searched && list.length === 0 && keyword.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                search(keyword);
                setOpen(true);
              }
            }}
            onFocus={() => setOpen(true)}
            placeholder="输入机构编号或机构名称"
            className="form-input pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            search(keyword);
            setOpen(true);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          搜索
        </button>
      </div>

      {open && (
        <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
              <Loader2 className="size-4 animate-spin mr-2" /> 加载中…
            </div>
          ) : showEmptyCta ? (
            <div className="px-4 py-5 text-center space-y-3">
              <div className="text-sm text-gray-500">
                未检索到该机构，是否注册为培训机构？
              </div>
              <Link
                href="/dashboard/apply/INSTITUTION"
                className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                去申请培训机构
              </Link>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-6">未找到匹配的机构</div>
          ) : (
            list.map((it) => (
              <button
                type="button"
                key={it.id}
                onClick={() => handlePick(it)}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Building2 className="size-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {it.orgName || `机构#${it.id}`}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {it.association ? '培训协会 · ' : ''}
                    {it.address || ''}
                  </div>
                </div>
                {value === it.id && <Check className="size-4 text-primary shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
