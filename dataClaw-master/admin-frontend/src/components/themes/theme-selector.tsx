'use client';

import { useThemeConfig } from '@/components/themes/active-theme';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Icons } from '../icons';
import { THEMES } from './theme.config';

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='theme-selector' className='sr-only'>
        主题
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id='theme-selector'
          className='w-auto justify-start gap-1'
        >
          <span className='text-muted-foreground'>
            <Icons.palette />
          </span>
          <span className='text-muted-foreground text-xs'>主题</span>
          <SelectValue placeholder='选择主题' />
        </SelectTrigger>
        <SelectContent align='end'>
          {THEMES.length > 0 && (
            <SelectGroup>
              <SelectLabel>主题</SelectLabel>
              {THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
