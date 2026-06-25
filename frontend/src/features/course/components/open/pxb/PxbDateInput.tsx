'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

function formatDateValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDateValue(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
}

export function PxbDateInput({ id, value, onChange, min, max, placeholder = '请选择时间' }: Props) {
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
    <div className="pxb-date-field" ref={rootRef}>
      <input
        id={id}
        type="text"
        className="pxb-date-input"
        readOnly
        value={value}
        placeholder={placeholder}
        onClick={openPicker}
        onFocus={openPicker}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
      />
      {open ? (
        <div id={popupId} className="pxb-date-popup" role="dialog" aria-label="选择日期">
          <DayPicker
            mode="single"
            locale={zhCN}
            captionLayout="dropdown"
            fromYear={2000}
            toYear={2035}
            selected={draft}
            onSelect={setDraft}
            disabled={disabledDays}
            className="pxb-day-picker"
            defaultMonth={draft ?? minDate ?? new Date()}
          />
          <div className="pxb-date-popup-actions">
            <button type="button" onClick={handleClear}>
              清空
            </button>
            <button type="button" onClick={handleToday}>
              今天
            </button>
            <button type="button" onClick={handleConfirm}>
              确定
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
