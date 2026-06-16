'use client';

import { useState } from 'react';
import { Images } from 'lucide-react';
import { MaterialPickerDialog } from './MaterialPickerDialog';
import type { OpsMaterialItem, OpsMaterialType } from '../api/types';

type MaterialPickerButtonProps = {
  materialType: OpsMaterialType;
  category?: string;
  scene?: string;
  label?: string;
  className?: string;
  onSelect: (url: string, item: OpsMaterialItem) => void;
};

export function MaterialPickerButton({
  materialType,
  category,
  scene,
  label = '从素材库选择',
  className,
  onSelect
}: MaterialPickerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/5 text-xs font-medium transition-colors'
        }
      >
        <Images className="size-3.5" />
        {label}
      </button>

      <MaterialPickerDialog
        open={open}
        onOpenChange={setOpen}
        materialType={materialType}
        category={category}
        scene={scene}
        onSelect={(item) => onSelect(item.url, item)}
      />
    </>
  );
}
