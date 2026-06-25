'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/http/client';
import { getCourseList } from '../../../api/service';
import type { CategoryTreeNode, PageResponse, CourseListItem } from '../../../api/types';
import {
  parsePxbOpenCourseUrl,
  replacePxbOpenCourseUrl,
  pxbOpenCourseListParams,
  type PxbOpenCourseUrlState,
} from './pxb-open-course-url';
import {
  togglePxbSort,
  sortLinkClass,
  type PxbSortField,
  FIELD_SORT_BYS,
  type PxbSortBy,
} from './pxb-sort';
import { PxbOpenCourseListItem } from './PxbOpenCourseListItem';
import { PxbDateInput } from './PxbDateInput';

interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  hasChildren: boolean;
}

const HOT_PROVINCE_NAMES = [
  '上海',
  '北京',
  '广东',
  '浙江',
  '江苏',
  '山东',
  '四川',
  '湖北',
  '湖南',
  '河南',
];

const HOT_CATEGORY_COUNT = 9;

interface Props {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
}

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      className={`pxb-filter-chip${selected ? ' is-selected' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      {children}
    </span>
  );
}

function useHoverMorePanel() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState<'category' | 'area' | null>(null);

  const show = (key: 'category' | 'area') => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(key);
  };

  const scheduleHide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(null), 350);
  };

  const toggle = (key: 'category' | 'area') => {
    if (timer.current) clearTimeout(timer.current);
    setOpen((prev) => (prev === key ? null : key));
  };

  return { open, show, scheduleHide, toggle };
}

function FilterMoreAnchor({
  panelKey,
  open,
  onShow,
  onHide,
  onToggle,
  children,
}: {
  panelKey: 'category' | 'area';
  open: boolean;
  onShow: (key: 'category' | 'area') => void;
  onHide: () => void;
  onToggle: (key: 'category' | 'area') => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pxb-more-anchor${open ? ' is-open' : ''}`}
      onMouseEnter={() => onShow(panelKey)}
      onMouseLeave={onHide}
    >
      <span
        className="pxb-more-trigger"
        role="button"
        tabIndex={0}
        onClick={() => onToggle(panelKey)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onToggle(panelKey);
        }}
      >
        更多&gt;&gt;
      </span>
      <div className={`pxb-more-panel${open ? ' is-open' : ''}`}>{children}</div>
    </div>
  );
}

function sortAnchorClass(sortBy: string, field: PxbSortField): string {
  const dir = sortLinkClass(sortBy, field);
  const active = FIELD_SORT_BYS[field].includes(sortBy as PxbSortBy);
  return [active ? 'is-active' : '', dir].filter(Boolean).join(' ');
}

function PxbOpenCourseListSectionInner({ initialData, categoryTree }: Props) {
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const morePanel = useHoverMorePanel();
  const [keywordInput, setKeywordInput] = useState('');
  const [customBegin, setCustomBegin] = useState('');
  const [customFinish, setCustomFinish] = useState('');
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');

  const urlState = useMemo(
    () => parsePxbOpenCourseUrl(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  useEffect(() => {
    setKeywordInput(urlState.keyword);
    setCustomBegin(urlState.startTimeFrom ?? '');
    setCustomFinish(urlState.startTimeTo ?? '');
    setCustomMinPrice(urlState.priceMin != null ? String(urlState.priceMin) : '');
    setCustomMaxPrice(urlState.priceMax != null ? String(urlState.priceMax) : '');
  }, [urlState]);

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

  const hotCategories = categoryTree.slice(0, HOT_CATEGORY_COUNT);
  const selectedCategory = categoryTree.find((c) => c.id === urlState.categoryId);
  const subCategories = selectedCategory?.children ?? [];
  const hotProvinces = useMemo(() => {
    const picked: RegionItem[] = [];
    for (const name of HOT_PROVINCE_NAMES) {
      const p = provinces.find((x) => x.name === name || x.name.startsWith(name));
      if (p) picked.push(p);
    }
    return picked;
  }, [provinces]);

  const applyState = useCallback((next: PxbOpenCourseUrlState) => {
    replacePxbOpenCourseUrl(next);
    startTransition(async () => {
      try {
        const result = await getCourseList(pxbOpenCourseListParams(next));
        setData(result);
      } catch (e) {
        console.error('PXB 公开课列表加载失败', e);
      }
    });
  }, []);

  const patchState = useCallback(
    (patch: Partial<PxbOpenCourseUrlState>, resetPage = true) => {
      applyState({
        ...urlState,
        ...patch,
        page: resetPage ? 1 : patch.page ?? urlState.page,
      });
    },
    [applyState, urlState],
  );

  const resetAll = () => {
    applyState({ page: 1, keyword: '', sortBy: 'default' });
  };

  const handleKeywordSearch = () => {
    if (!keywordInput.trim()) {
      window.alert('请输入关键字');
      return;
    }
    patchState({ keyword: keywordInput.trim() });
  };

  const handleCustomDate = () => {
    if (!customBegin && !customFinish) return;
    patchState({
      timeQuick: undefined,
      startTimeFrom: customBegin || undefined,
      startTimeTo: customFinish || undefined,
    });
  };

  const handleCustomPrice = () => {
    const min = customMinPrice ? parseInt(customMinPrice, 10) : NaN;
    const max = customMaxPrice ? parseInt(customMaxPrice, 10) : NaN;
    if (Number.isNaN(min) || Number.isNaN(max)) {
      window.alert('请输入正确的价格');
      return;
    }
    if (max <= min) {
      window.alert('请输入正确的价格区间');
      return;
    }
    patchState({
      pricePreset: undefined,
      priceMin: min,
      priceMax: max,
    });
  };

  const handleSortClick = (field: PxbSortField) => {
    patchState({ sortBy: togglePxbSort(urlState.sortBy, field) });
  };

  const pages = data.totalPages || 1;
  const currentPage = urlState.page;

  return (
    <div id="pxb_content" className="pxb-open-course">
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
          <button
            type="button"
            className="pxb-search-btn"
            onClick={handleKeywordSearch}
          >
            搜索
          </button>
        </div>

        <div className="pxb-search-content">
          <div className="pxb-filter-row">
            <div className="pxb-filter-label">课程分类：</div>
            <div className="pxb-filter-value">
              <div className="pxb-filter-group">
                <FilterChip
                  selected={!urlState.categoryId}
                  onClick={() => patchState({ categoryId: undefined, subCategoryId: undefined })}
                >
                  不限
                </FilterChip>
                {hotCategories.map((cat) => (
                  <FilterChip
                    key={cat.id}
                    selected={urlState.categoryId === cat.id && !urlState.subCategoryId}
                    onClick={() => patchState({ categoryId: cat.id, subCategoryId: undefined })}
                  >
                    {cat.name}
                  </FilterChip>
                ))}
                <FilterMoreAnchor
                  panelKey="category"
                  open={morePanel.open === 'category'}
                  onShow={morePanel.show}
                  onHide={morePanel.scheduleHide}
                  onToggle={morePanel.toggle}
                >
                  {categoryTree.map((cat) => (
                    <FilterChip
                      key={cat.id}
                      selected={urlState.categoryId === cat.id && !urlState.subCategoryId}
                      onClick={() => patchState({ categoryId: cat.id, subCategoryId: undefined })}
                    >
                      {cat.name}
                    </FilterChip>
                  ))}
                </FilterMoreAnchor>
              </div>
              {urlState.categoryId && subCategories.length > 0 ? (
                <div className="pxb-sub-panel">
                  <FilterChip
                    selected={!urlState.subCategoryId}
                    onClick={() => patchState({ subCategoryId: undefined })}
                  >
                    不限
                  </FilterChip>
                  {subCategories.map((sub) => (
                    <FilterChip
                      key={sub.id}
                      selected={urlState.subCategoryId === sub.id}
                      onClick={() =>
                        patchState({ subCategoryId: sub.id, categoryId: urlState.categoryId })
                      }
                    >
                      {sub.name}
                    </FilterChip>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="pxb-filter-row">
            <div className="pxb-filter-label">开课省市：</div>
            <div className="pxb-filter-value">
              <div className="pxb-filter-group">
                <FilterChip
                  selected={!urlState.provinceId}
                  onClick={() => patchState({ provinceId: undefined, cityId: undefined })}
                >
                  不限
                </FilterChip>
                {hotProvinces.map((p) => (
                  <FilterChip
                    key={p.id}
                    selected={urlState.provinceId === p.id && !urlState.cityId}
                    onClick={() => patchState({ provinceId: p.id, cityId: undefined })}
                  >
                    {p.name}
                  </FilterChip>
                ))}
                <FilterMoreAnchor
                  panelKey="area"
                  open={morePanel.open === 'area'}
                  onShow={morePanel.show}
                  onHide={morePanel.scheduleHide}
                  onToggle={morePanel.toggle}
                >
                  {provinces.map((p) => (
                    <FilterChip
                      key={p.id}
                      selected={urlState.provinceId === p.id && !urlState.cityId}
                      onClick={() => patchState({ provinceId: p.id, cityId: undefined })}
                    >
                      {p.name}
                    </FilterChip>
                  ))}
                </FilterMoreAnchor>
              </div>
              {urlState.provinceId && cities.length > 0 ? (
                <div className="pxb-sub-panel">
                  <FilterChip
                    selected={!urlState.cityId}
                    onClick={() => patchState({ cityId: undefined })}
                  >
                    不限
                  </FilterChip>
                  {cities.map((c) => (
                    <FilterChip
                      key={c.id}
                      selected={urlState.cityId === c.id}
                      onClick={() =>
                        patchState({ cityId: c.id, provinceId: urlState.provinceId })
                      }
                    >
                      {c.name}
                    </FilterChip>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="pxb-filter-row">
            <div className="pxb-filter-label">开课时间：</div>
            <div className="pxb-filter-value">
              <FilterChip
                selected={!urlState.timeQuick && !urlState.startTimeFrom && !urlState.startTimeTo}
                onClick={() =>
                  patchState({ timeQuick: undefined, startTimeFrom: undefined, startTimeTo: undefined })
                }
              >
                不限
              </FilterChip>
              <FilterChip
                selected={
                  !urlState.timeQuick
                  && !!urlState.startTimeFrom
                  && urlState.startTimeTo === addMonths(6)
                }
                onClick={() =>
                  patchState({
                    timeQuick: undefined,
                    startTimeFrom: todayStr(),
                    startTimeTo: addMonths(6),
                  })
                }
              >
                近半年
              </FilterChip>
              <FilterChip
                selected={urlState.timeQuick === 'nextThreeMonths'}
                onClick={() =>
                  patchState({ timeQuick: 'nextThreeMonths', startTimeFrom: undefined, startTimeTo: undefined })
                }
              >
                近3个月
              </FilterChip>
              <FilterChip
                selected={urlState.timeQuick === 'thisMonth'}
                onClick={() =>
                  patchState({ timeQuick: 'thisMonth', startTimeFrom: undefined, startTimeTo: undefined })
                }
              >
                近1个月
              </FilterChip>
              <FilterChip
                selected={urlState.timeQuick === 'thisWeek'}
                onClick={() =>
                  patchState({ timeQuick: 'thisWeek', startTimeFrom: undefined, startTimeTo: undefined })
                }
              >
                近1周
              </FilterChip>
              <span className="pxb-inline-controls">
                <PxbDateInput
                  id="begin"
                  value={customBegin}
                  onChange={setCustomBegin}
                />
                <span className="pxb-range-sep">-</span>
                <PxbDateInput
                  id="finish"
                  value={customFinish}
                  onChange={setCustomFinish}
                  min={customBegin || undefined}
                />
                <button type="button" className="pxb-confirm-btn" onClick={handleCustomDate}>
                  确定
                </button>
              </span>
            </div>
          </div>

          <div className="pxb-filter-row">
            <div className="pxb-filter-label">价格范围：</div>
            <div className="pxb-filter-value">
              {[
                { key: '', label: '不限' },
                { key: '1', label: '0-2000元' },
                { key: '2', label: '2001-5000元' },
                { key: '3', label: '5001-10000元' },
                { key: '4', label: '10000以上' },
              ].map((opt) => (
                <FilterChip
                  key={opt.key || 'all'}
                  selected={
                    opt.key
                      ? urlState.pricePreset === opt.key
                      : !urlState.pricePreset && urlState.priceMin == null && urlState.priceMax == null
                  }
                  onClick={() =>
                    patchState({
                      pricePreset: opt.key || undefined,
                      priceMin: undefined,
                      priceMax: undefined,
                    })
                  }
                >
                  {opt.label}
                </FilterChip>
              ))}
              <span className="pxb-inline-controls">
                <input
                  type="text"
                  className="pxb-mini-input"
                  id="minPrice"
                  value={customMinPrice}
                  onChange={(e) => setCustomMinPrice(e.target.value)}
                />
                <span className="pxb-range-sep">-</span>
                <input
                  type="text"
                  className="pxb-mini-input"
                  id="maxPrice"
                  value={customMaxPrice}
                  onChange={(e) => setCustomMaxPrice(e.target.value)}
                />
                <button type="button" className="pxb-confirm-btn" onClick={handleCustomPrice}>
                  确定
                </button>
              </span>
            </div>
          </div>

          <div className="pxb-filter-row">
            <div className="pxb-filter-label">课程评价：</div>
            <div className="pxb-filter-value">
              {[
                { score: undefined, label: '不限' },
                { score: 3, label: '三星以上' },
                { score: 4, label: '四星以上' },
                { score: 5, label: '五星' },
              ].map((opt) => (
                <FilterChip
                  key={opt.label}
                  selected={
                    urlState.minScore === opt.score
                    || (!urlState.minScore && opt.score === undefined)
                  }
                  onClick={() => patchState({ minScore: opt.score })}
                >
                  {opt.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="pxb-filter-row">
            <div className="pxb-filter-label">报名状态：</div>
            <div className="pxb-filter-value">
              <FilterChip
                selected={!urlState.enrollStatus}
                onClick={() => patchState({ enrollStatus: undefined })}
              >
                全部
              </FilterChip>
              <FilterChip
                selected={urlState.enrollStatus === 'ENROLLING'}
                onClick={() => patchState({ enrollStatus: 'ENROLLING' })}
              >
                报名中
              </FilterChip>
            </div>
          </div>

          <div className="pxb-reset-link">
            <a href="/opencourse?origin=91pxb" onClick={(e) => { e.preventDefault(); resetAll(); }}>
              全部撤销
            </a>
          </div>
        </div>
      </div>

      <div className="pxb-sort-bar">
        <ul>
          <li>
            <a
              href="#"
              className={sortAnchorClass(urlState.sortBy, 'default')}
              onClick={(e) => {
                e.preventDefault();
                handleSortClick('default');
              }}
            >
              默认<i aria-hidden />
            </a>
          </li>
          <li>-</li>
          <li>
            <a
              href="#"
              className={sortAnchorClass(urlState.sortBy, 'time')}
              onClick={(e) => {
                e.preventDefault();
                handleSortClick('time');
              }}
            >
              开课时间<i aria-hidden />
            </a>
          </li>
          <li>-</li>
          <li>
            <a
              href="#"
              className={sortAnchorClass(urlState.sortBy, 'price')}
              onClick={(e) => {
                e.preventDefault();
                handleSortClick('price');
              }}
            >
              价格<i aria-hidden />
            </a>
          </li>
          <li>-</li>
          <li>
            <a
              href="#"
              className={sortAnchorClass(urlState.sortBy, 'score')}
              onClick={(e) => {
                e.preventDefault();
                handleSortClick('score');
              }}
            >
              评价<i aria-hidden />
            </a>
          </li>
        </ul>
      </div>

      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        {data.list.length > 0 ? (
          data.list.map((course) => (
            <PxbOpenCourseListItem key={course.id} course={course} />
          ))
        ) : (
          <div className="pxb-empty">对不起，暂时没有找到你要的信息</div>
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

export function PxbOpenCourseListSection(props: Props) {
  return (
    <Suspense fallback={<div style={{ minHeight: 320 }} />}>
      <PxbOpenCourseListSectionInner {...props} />
    </Suspense>
  );
}
