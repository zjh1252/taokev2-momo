'use client';

import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/http/client';
import { dispatchPxbContentResize } from '@/lib/pxb-embed';
import { getTrainerList } from '../../api/service';
import type { CategoryTreeNode, PageResponse, TrainerListItem } from '../../types';
import {
  parsePxbTrainerListUrl,
  replacePxbTrainerListUrl,
  pxbTrainerListParams,
  type PxbTrainerListUrlState,
} from './pxb-trainer-list-url';
import {
  togglePxbTrainerSort,
  trainerSortLinkClass,
  PXB_TRAINER_SORT_LABELS,
  type PxbTrainerSortField,
} from './pxb-trainer-sort';
import { PxbTrainerListItem } from './PxbTrainerListItem';

interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  hasChildren: boolean;
}

const SORT_FIELDS: PxbTrainerSortField[] = ['default', 'score'];

interface Props {
  initialData: PageResponse<TrainerListItem>;
  expertiseTree: CategoryTreeNode[];
  industryTree: CategoryTreeNode[];
}

function flattenL1Categories(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  return tree.filter((n) => n.level === 1);
}

function PxbTrainerListSectionInner({ initialData, expertiseTree, industryTree }: Props) {
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const urlState = useMemo(
    () => parsePxbTrainerListUrl(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const expertiseOptions = useMemo(() => flattenL1Categories(expertiseTree), [expertiseTree]);
  const industryOptions = useMemo(() => flattenL1Categories(industryTree), [industryTree]);

  useEffect(() => {
    setKeywordInput(urlState.keyword);
  }, [urlState]);

  useEffect(() => {
    dispatchPxbContentResize();
  }, [data, isPending]);

  useEffect(() => {
    apiGet<{ data: RegionItem[] }>('/regions/children')
      .then((res) => setProvinces(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!urlState.provinceId) {
      setCities([]);
      return;
    }
    const province = provinces.find((p) => p.id === urlState.provinceId);
    if (!province?.code) {
      setCities([]);
      return;
    }
    apiGet<{ data: RegionItem[] }>(`/regions/children?parentCode=${province.code}`)
      .then((res) => setCities(res.data || []))
      .catch(() => setCities([]));
  }, [urlState.provinceId, provinces]);

  const applyState = useCallback((next: PxbTrainerListUrlState) => {
    replacePxbTrainerListUrl(next);
    startTransition(async () => {
      try {
        const result = await getTrainerList(pxbTrainerListParams(next));
        setData(result);
      } catch (e) {
        console.error('PXB 讲师列表加载失败', e);
      }
    });
  }, []);

  const patchState = useCallback(
    (patch: Partial<PxbTrainerListUrlState>, resetPage = true) => {
      applyState({
        ...urlState,
        ...patch,
        page: resetPage ? 1 : patch.page ?? urlState.page,
      });
    },
    [applyState, urlState],
  );

  const resetAll = () => {
    applyState({ page: 1, keyword: '', quality: 'all', sortBy: 'default' });
  };

  const handleKeywordSearch = () => {
    if (!keywordInput.trim()) {
      window.alert('请输入关键字');
      return;
    }
    patchState({ keyword: keywordInput.trim() });
  };

  const handleSortClick = (field: PxbTrainerSortField) => {
    patchState({ sortBy: togglePxbTrainerSort(urlState.sortBy, field) });
  };

  const pages = data.totalPages || 1;
  const currentPage = urlState.page;

  return (
    <div id="pxb_content" className="pxb-trainer-list">
      <div className="pxb-insearch">
        <div className="pxb-search-box">
          关键字：
          <input
            type="text"
            name="keywords"
            id="keywords"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleKeywordSearch();
            }}
          />
          <button type="button" className="pxb-search-btn" onClick={handleKeywordSearch}>
            搜索
          </button>
        </div>

        <div className="pxb-search-content">
          <div className="pxb-filter-row pxb-trainer-filters">
            <div className="pxb-filter-label">筛选：</div>
            <div className="pxb-filter-value">
              <span className="pxb-select-label">擅长领域：</span>
              <select
                className="pxb-select"
                value={urlState.expertiseCategoryId ?? ''}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  patchState({ expertiseCategoryId: v });
                }}
              >
                <option value="">不限</option>
                {expertiseOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <span className="pxb-select-label">行业背景：</span>
              <select
                className="pxb-select"
                value={urlState.industryCategoryId ?? ''}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  patchState({ industryCategoryId: v });
                }}
              >
                <option value="">不限</option>
                {industryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <span className="pxb-select-label">常驻省份：</span>
              <select
                className="pxb-select pxb-select-short"
                value={urlState.provinceId ?? ''}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  patchState({ provinceId: v, cityId: undefined });
                }}
              >
                <option value="">不限</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                className="pxb-select pxb-select-short"
                value={urlState.cityId ?? ''}
                disabled={!urlState.provinceId || cities.length === 0}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  patchState({ cityId: v });
                }}
              >
                <option value="">不限</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pxb-filter-row">
            <div className="pxb-filter-label">讲师资质：</div>
            <div className="pxb-filter-value">
              <label className="pxb-radio">
                <input
                  type="radio"
                  name="quality"
                  checked={urlState.quality === 'all'}
                  onChange={() => patchState({ quality: 'all' })}
                />
                普通讲师
              </label>
              <label className="pxb-radio">
                <input
                  type="radio"
                  name="quality"
                  checked={urlState.quality === 'premium'}
                  onChange={() => patchState({ quality: 'premium' })}
                />
                优质讲师
              </label>
            </div>
          </div>

          <div className="pxb-reset-link">
            <a href="/trainer?origin=91pxb" onClick={(e) => { e.preventDefault(); resetAll(); }}>
              全部撤销
            </a>
          </div>
        </div>
      </div>

      <div className="pxb-sort-bar">
        <ul>
          {SORT_FIELDS.map((field, idx) => (
            <Fragment key={field}>
              {idx > 0 ? <li>-</li> : null}
              <li>
                <a
                  href="#"
                  className={trainerSortLinkClass(urlState.sortBy, field)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSortClick(field);
                  }}
                >
                  {PXB_TRAINER_SORT_LABELS[field]}<i aria-hidden />
                </a>
              </li>
            </Fragment>
          ))}
        </ul>
      </div>

      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        {data.list.length > 0 ? (
          data.list.map((trainer) => (
            <PxbTrainerListItem key={trainer.id} trainer={trainer} />
          ))
        ) : (
          <div className="pxb-empty">
            对不起，暂时没有找到你要的信息，请尝试其他查询条件！
          </div>
        )}
      </div>

      {pages > 1 ? (
        <div className="pxb-pagination">
          {currentPage > 1 ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                patchState({ page: currentPage - 1 }, false);
              }}
            >
              上一页
            </a>
          ) : null}
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pages || Math.abs(p - currentPage) <= 2)
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 ? ' ... ' : null}
                {p === currentPage ? (
                  <strong>{p}</strong>
                ) : (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      patchState({ page: p }, false);
                    }}
                  >
                    {p}
                  </a>
                )}
              </span>
            ))}
          {currentPage < pages ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                patchState({ page: currentPage + 1 }, false);
              }}
            >
              下一页
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PxbTrainerListSection(props: Props) {
  return (
    <Suspense fallback={<div style={{ minHeight: 320 }} />}>
      <PxbTrainerListSectionInner {...props} />
    </Suspense>
  );
}
