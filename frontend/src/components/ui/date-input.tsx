'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type DateInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  type?: 'date' | 'datetime-local';
  placeholder?: string;
  placeholderClassName?: string;
};

export function DateInput({
  className,
  type = 'date',
  placeholder = '年 / 月 / 日',
  placeholderClassName,
  value,
  ...props
}: DateInputProps) {
  const isEmpty = value === '' || value === undefined || value === null;

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        className={cn(className, isEmpty && 'text-transparent caret-transparent')}
      />
      {isEmpty ? (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 z-10 flex items-center px-3 whitespace-nowrap text-gray-400',
            placeholderClassName
          )}
        >
          {placeholder}
        </span>
      ) : null}
    </div>
  );
}
