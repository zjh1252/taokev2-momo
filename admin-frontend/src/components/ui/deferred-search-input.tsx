'use client';

import * as React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DeferredSearchInputProps = {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

/** 本地输入 + 点击/回车触发搜索，避免输入过程中频繁请求 */
export function DeferredSearchInput({
  value,
  onSearch,
  placeholder,
  className,
  inputClassName
}: DeferredSearchInputProps) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const submit = React.useCallback(() => {
    onSearch(draft.trim());
  }, [draft, onSearch]);

  return (
    <div className={cn('relative flex items-center', className)}>
      <Input
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        }}
        className={cn('h-8 pr-8', inputClassName)}
      />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='absolute top-0 right-0 h-8 w-8 shrink-0'
        aria-label='搜索'
        onClick={submit}
      >
        <Icons.search className='h-4 w-4' />
      </Button>
    </div>
  );
}
