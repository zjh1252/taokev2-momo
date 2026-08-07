'use client';

import {
  Fragment,
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
import { dispatchPxbContentResize } from '@/lib/pxb-embed';
import { getCourseList } from '../../../api/service';
import type { CategoryTreeNode, PageResponse, CourseListItem } from '../../../api/types';
import {
  type PxbCourseListConfig,
  PXB_SORT_LABELS,
} from './config/pxb-course-list-config';
import {
  parsePxbCourseListUrl,
  replacePxbCourseListUrl,
  pxbCourseListParams,
  type PxbCourseListUrlState,
} from './pxb-course-list-url';
import {
  togglePxbSort,
  sortLinkClass,
  type PxbSortField,
  FIELD_SORT_BYS,
  type PxbSortBy,
} from './pxb-sort';
import { PxbCourseListItem } from './PxbCourseListItem';
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
  config: PxbCourseListConfig;
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

function PxbCourseListSectionInner({ config, initialData, categoryTree }: Props) {
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
    () => parsePxbCourseListUrl(new URLSearchParams(searchParams.toString())),
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
    apiGet<{ data: RegionItem[] }>('/regions/children', { skipAuth: true })
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
    apiGet<{ data: RegionItem[] }>(`/regions/children?parentCode=${province.code}`, {
      skipAuth: true,
    })
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

  useEffect(() => {
    dispatchPxbContentResize();
  }, [data, isPending]);

  const applyState = useCallback((next: PxbCourseListUrlState) => {
    replacePxbCourseListUrl(next, config);
    startTransition(async () => {
      try {
        const result = await getCourseList(pxbCourseListParams(next, config));
        setData(result);
      } catch (e) {
        console.error(`PXB ${config.pageTitle}加载失败`, e);
      }
    });
  }, [config]);

  const patchState = useCallback(
    (patch: Partial<PxbCourseListUrlState>, resetPage = true) => {
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

  const selectedFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: Partial<PxbCourseListUrlState> }[] = [];
    if (urlState.keyword) {
      chips.push({
        key: 'keyword',
        label: `关键词：${urlState.keyword}`,
        clear: { keyword: '' },
      });
    }
    if (urlState.categoryId) {
      const cat = categoryTree.find((c) => c.id === urlState.categoryId);
      const sub = cat?.children?.find((c) => c.id === urlState.subCategoryId);
      const name = sub?.name ?? cat?.name ?? `#${urlState.categoryId}`;
      chips.push({
        key: 'category',
        label: `分类：${name}`,
        clear: { categoryId: undefined, subCategoryId: undefined },
      });
    }
    if (urlState.provinceId) {
      const province = provinces.find((p) => p.id === urlState.provinceId);
      const city = cities.find((c) => c.id === urlState.cityId);
      const name = city?.name
        ? `${province?.name ?? ''} ${city.name}`.trim()
        : (province?.name ?? `#${urlState.provinceId}`);
      chips.push({
        key: 'area',
        label: `${config.locationLabel}：${name}`,
        clear: { provinceId: undefined, cityId: undefined },
      });
    }
    if (urlState.timeQuick) {
      const labels: Record<string, string> = {
        thisWeek: '本周内',
        thisMonth: '本月内',
        nextThreeMonths: '近三个月',
      };
      chips.push({
        key: 'timeQuick',
        label: `开课时间：${labels[urlState.timeQuick] ?? urlState.timeQuick}`,
        clear: { timeQuick: undefined },
      });
    } else if (urlState.startTimeFrom || urlState.startTimeTo) {
      chips.push({
        key: 'timeRange',
        label: `开课时间：${urlState.startTimeFrom ?? '不限'} ~ ${urlState.startTimeTo ?? '不限'}`,
        clear: { startTimeFrom: undefined, startTimeTo: undefined },
      });
    }
    if (urlState.pricePreset) {
      const preset = config.pricePresets.find((p) => p.key === urlState.pricePreset);
      chips.push({
        key: 'pricePreset',
        label: `价格：${preset?.label ?? urlState.pricePreset}`,
        clear: { pricePreset: undefined, priceMin: undefined, priceMax: undefined },
      });
    } else if (urlState.priceMin != null || urlState.priceMax != null) {
      chips.push({
        key: 'price',
        label: `价格：${urlState.priceMin ?? '不限'} - ${urlState.priceMax ?? '不限'}`,
        clear: { priceMin: undefined, priceMax: undefined, pricePreset: undefined },
      });
    }
    if (urlState.minScore != null) {
      chips.push({
        key: 'minScore',
        label: `评分：≥${urlState.minScore}`,
        clear: { minScore: undefined },
      });
    }
    if (urlState.enrollStatus) {
      chips.push({
        key: 'enrollStatus',
        label: `报名：${urlState.enrollStatus === 'ENROLLING' ? '报名中' : urlState.enrollStatus}`,
        clear: { enrollStatus: undefined },
      });
    }
    return chips;
  }, [urlState, categoryTree, provinces, cities, config.locationLabel, config.pricePresets]);

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
  const resetHref = `${config.basePath}?origin=91pxb`;

  return (
    <div id="pxb_content" className="pxb-course-list">
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
            <div className="pxb-filter-label">{config.locationLabel}：</div>
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

          {config.showTimeFilter ? (
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
          ) : null}

          <div className="pxb-filter-row">
            <div className="pxb-filter-label">价格范围：</div>
            <div className="pxb-filter-value">
              {config.pricePresets.map((opt) => (
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

          {config.showEnrollStatus ? (
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
          ) : null}

          <div className="pxb-reset-link">
            <a href={resetHref} onClick={(e) => { e.preventDefault(); resetAll(); }}>
              全部撤销
            </a>
          </div>
        </div>
      </div>

      <div className="pxb-sort-bar">
        <ul>
          {config.sortFields.map((field, idx) => (
            <Fragment key={field}>
              {idx > 0 ? <li>-</li> : null}
              <li>
                <a
                  href="#"
                  className={sortAnchorClass(urlState.sortBy, field)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSortClick(field);
                  }}
                >
                  {PXB_SORT_LABELS[field]}<i aria-hidden />
                </a>
              </li>
            </Fragment>
          ))}
        </ul>
      </div>

      {selectedFilterChips.length > 0 ? (
        <div
          className="pxb-selected-filters"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            margin: '8px 0 12px',
            padding: '8px 10px',
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 4,
          }}
        >
          <span style={{ fontSize: 12, color: '#888' }}>已选条件：</span>
          {selectedFilterChips.map((chip) => (
            <span
              key={chip.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                fontSize: 12,
                color: '#c00',
                background: '#fff5f5',
                borderRadius: 999,
              }}
            >
              {chip.label}
              <button
                type="button"
                aria-label={`移除 ${chip.label}`}
                onClick={() => patchState(chip.clear)}
                style={{
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#c00',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={resetAll}
            style={{
              marginLeft: 'auto',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              color: '#888',
            }}
          >
            重置
          </button>
        </div>
      ) : null}

      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        {data.list.length > 0 ? (
          data.list.map((course) => (
            <PxbCourseListItem key={course.id} course={course} config={config} />
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

export function PxbCourseListSection(props: Props) {
  return (
    <Suspense fallback={<div style={{ minHeight: 320 }} />}>
      <PxbCourseListSectionInner {...props} />
    </Suspense>
  );
}
