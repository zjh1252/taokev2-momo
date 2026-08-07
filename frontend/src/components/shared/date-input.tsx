'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import 'react-day-picker/style.css';

import { cn } from '@/lib/utils';

/** 全站日期输入统一占位文案（原生 type=date 会忽略 placeholder） */
export const DATE_PLACEHOLDER = '年 / 月 / 日';

function formatDateValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDateValue(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface DateInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 外层容器 class，默认占满宽度 */
  wrapperClassName?: string;
}

/**
 * 自定义日期选择器：支持中文占位「年 / 月 / 日」，值仍为 YYYY-MM-DD。
 * 用于替代原生 type="date"（浏览器会强制显示 yyyy/mm/日 等文案）。
 */
export function DateInput({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = DATE_PLACEHOLDER,
  disabled = false,
  className,
  wrapperClassName,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date | undefined>(() => parseDateValue(value));
  const rootRef = useRef<HTMLDivElement>(null);
  const popupId = useId();

  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);

  useEffect(() => {
    setDraft(parseDateValue(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const openPicker = () => {
    if (disabled) return;
    setDraft(parseDateValue(value));
    setOpen(true);
  };

  const disabledDays = (date: Date) => {
    const day = startOfDay(date);
    if (minDate && day < startOfDay(minDate)) return true;
    if (maxDate && day > startOfDay(maxDate)) return true;
    return false;
  };

  const handleConfirm = () => {
    if (draft) {
      onChange(formatDateValue(draft));
    }
    setOpen(false);
  };

  const handleClear = () => {
    setDraft(undefined);
    onChange('');
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!disabledDays(today)) {
      setDraft(today);
      onChange(formatDateValue(today));
    }
    setOpen(false);
  };

  return (
    <div className={cn('relative w-full', wrapperClassName)} ref={rootRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          readOnly
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onClick={openPicker}
          onFocus={openPicker}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popupId : undefined}
          className={cn(
            'w-full cursor-pointer pr-9 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        />
        <CalendarIcon
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
      </div>
      {open ? (
        <div
          id={popupId}
          className="absolute left-0 top-[calc(100%+4px)] z-60 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
          role="dialog"
          aria-label="选择日期"
        >
          <DayPicker
            mode="single"
            locale={zhCN}
            captionLayout="dropdown"
            fromYear={2000}
            toYear={2035}
            selected={draft}
            onSelect={setDraft}
            disabled={disabledDays}
            defaultMonth={draft ?? minDate ?? maxDate ?? new Date()}
          />
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="rounded px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              清空
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              今天
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded bg-primary px-2.5 py-1 text-xs text-white hover:bg-primary/90"
            >
              确定
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
