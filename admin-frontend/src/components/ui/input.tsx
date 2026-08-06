import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, placeholder, value, ...props }: React.ComponentProps<'input'>) {
  const isDate = type === 'date' || type === 'datetime-local';
  const isEmpty = isDate && (value === '' || value === undefined || value === null);
  const datePlaceholder = placeholder ?? '年 / 月 / 日';

  const input = (
    <input
      type={type}
      data-slot='input'
      value={value}
      placeholder={isDate ? datePlaceholder : placeholder}
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        isDate && isEmpty && 'text-transparent caret-transparent',
        className
      )}
      {...props}
    />
  );

  if (!isDate) {
    return input;
  }

  return (
    <div className='relative w-full'>
      {input}
      {isEmpty ? (
        <span
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 z-10 flex items-center whitespace-nowrap px-3 text-base text-muted-foreground md:text-sm'
        >
          {datePlaceholder}
        </span>
      ) : null}
    </div>
  );
}

export { Input };
