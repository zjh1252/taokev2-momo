'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import 'react-day-picker/style.css';

import { cn } from '@/lib/utils';
import { DATE_PLACEHOLDER } from '@/components/shared/date-input';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDatePart(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 解析 datetime-local 值（YYYY-MM-DDTHH:mm） */
function parseDateTimeValue(value?: string): { date?: Date; time: string } {
  if (!value) return { time: '00:00' };
  const [datePart, timePart = '00:00'] = value.split('T');
  const d = new Date(`${datePart}T00:00:00`);
  return {
    date: Number.isNaN(d.getTime()) ? undefined : d,
    time: timePart.slice(0, 5) || '00:00',
  };
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface DateTimeLocalInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
}

/**
 * 自定义日期时间选择器：空态显示「年 / 月 / 日」，值仍为 YYYY-MM-DDTHH:mm。
 * 用于替代原生 type="datetime-local"。
 */
export function DateTimeLocalInput({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = DATE_PLACEHOLDER,
  disabled = false,
  className,
  wrapperClassName,
}: DateTimeLocalInputProps) {
  const parsed = parseDateTimeValue(value);
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(parsed.date);
  const [draftTime, setDraftTime] = useState(parsed.time);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupId = useId();

  const minDate = parseDateTimeValue(min).date;
  const maxDate = parseDateTimeValue(max).date;

  useEffect(() => {
    const next = parseDateTimeValue(value);
    setDraftDate(next.date);
    setDraftTime(next.time);
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
    const next = parseDateTimeValue(value);
    setDraftDate(next.date);
    setDraftTime(next.time);
    setOpen(true);
  };

  const disabledDays = (date: Date) => {
    const day = startOfDay(date);
    if (minDate && day < startOfDay(minDate)) return true;
    if (maxDate && day > startOfDay(maxDate)) return true;
    return false;
  };

  const displayValue = value
    ? value.includes('T')
      ? value.replace('T', ' ')
      : value
    : '';

  const handleConfirm = () => {
    if (!draftDate) return;
    onChange(`${formatDatePart(draftDate)}T${draftTime || '00:00'}`);
    setOpen(false);
  };

  const handleClear = () => {
    setDraftDate(undefined);
    setDraftTime('00:00');
    onChange('');
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
          value={displayValue}
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
          aria-label="选择日期时间"
        >
          <DayPicker
            mode="single"
            locale={zhCN}
            captionLayout="dropdown"
            fromYear={2000}
            toYear={2035}
            selected={draftDate}
            onSelect={setDraftDate}
            disabled={disabledDays}
            defaultMonth={draftDate ?? minDate ?? maxDate ?? new Date()}
          />
          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
            <label className="shrink-0 text-xs text-slate-500">时间</label>
            <input
              type="time"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value || '00:00')}
              className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="rounded px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              清空
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!draftDate}
              className="rounded bg-primary px-2.5 py-1 text-xs text-white hover:bg-primary/90 disabled:opacity-50"
            >
              确定
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
