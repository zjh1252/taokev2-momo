'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState, type ReactNode } from 'react';
import { Icons } from '@/components/icons';

export type CandidateDragPayload = {
  type: 'candidate';
  resourceId: number;
  name: string;
};

export type ManagedDragPayload = {
  type: 'managed';
  itemId: number;
  managedIndex: number;
  name: string;
};

export type SlotDropPayload = {
  type: 'slot';
  managedIndex: number | null;
};

export function candidateDragId(resourceId: number) {
  return `candidate-${resourceId}`;
}

export function managedDragId(itemId: number) {
  return `managed-${itemId}`;
}

export function slotDropId(key: string) {
  return `slot-${key}`;
}

/** 固定 ID，避免 @dnd-kit 在 SSR/客户端生成不同的 aria-describedby 导致 hydration 警告 */
const HOME_TRAINER_DND_CONTEXT_ID = 'home-trainer-dnd';

type HomeTrainerDndProviderProps = {
  children: ReactNode;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDropCandidate: (resourceId: number, targetIndex: number) => void;
};

export function HomeTrainerDndProvider({
  children,
  onReorder,
  onDropCandidate
}: HomeTrainerDndProviderProps) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as CandidateDragPayload | ManagedDragPayload | undefined;
    if (data?.type === 'candidate' || data?.type === 'managed') {
      setActiveLabel(data.name);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLabel(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as CandidateDragPayload | ManagedDragPayload | undefined;
    const overData = over.data.current as SlotDropPayload | ManagedDragPayload | undefined;
    if (!activeData || !overData) return;

    const targetIndex =
      overData.type === 'slot'
        ? overData.managedIndex
        : overData.type === 'managed'
          ? overData.managedIndex
          : null;
    if (targetIndex == null || targetIndex < 0) return;

    if (activeData.type === 'candidate') {
      onDropCandidate(activeData.resourceId, targetIndex);
      return;
    }

    if (activeData.type === 'managed') {
      onReorder(activeData.managedIndex, targetIndex);
    }
  };

  return (
    <DndContext
      id={HOME_TRAINER_DND_CONTEXT_ID}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeLabel ? (
          <div className='bg-background flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg'>
            <Icons.gripVertical className='text-muted-foreground h-4 w-4' />
            <span className='max-w-[200px] truncate font-medium'>{activeLabel}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function DraggableCandidateRow({
  resourceId,
  name,
  disabled,
  children
}: {
  resourceId: number;
  name: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidateDragId(resourceId),
    disabled,
    data: { type: 'candidate', resourceId, name } satisfies CandidateDragPayload
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.45 : 1 }
    : { opacity: isDragging ? 0.45 : 1 };

  return (
    <div ref={setNodeRef} style={style} className='flex items-center gap-2'>
      <button
        type='button'
        className='text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40'
        disabled={disabled}
        aria-label={`拖动 ${name}`}
        {...listeners}
        {...attributes}
      >
        <Icons.gripVertical className='h-4 w-4' />
      </button>
      <div className='min-w-0 flex-1'>{children}</div>
    </div>
  );
}

export function DroppablePreviewSlot({
  slotKey,
  managedIndex,
  droppable,
  className,
  children
}: {
  slotKey: string;
  managedIndex: number | null;
  droppable: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: slotDropId(slotKey),
    disabled: !droppable || managedIndex == null,
    data: { type: 'slot', managedIndex: managedIndex as number } satisfies SlotDropPayload
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${isOver && droppable ? 'ring-primary/60 ring-2 ring-offset-2' : ''}`}
    >
      {children}
    </div>
  );
}

export function DraggableManagedCard({
  itemId,
  managedIndex,
  name,
  className,
  children
}: {
  itemId: number;
  managedIndex: number;
  name: string;
  className?: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: managedDragId(itemId),
    data: { type: 'managed', itemId, managedIndex, name } satisfies ManagedDragPayload
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `${managedDragId(itemId)}-drop`,
    data: { type: 'managed', itemId, managedIndex, name } satisfies ManagedDragPayload
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : { opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={style}
      className={`${className ?? ''} ${isOver ? 'ring-primary/60 ring-2' : ''}`}
    >
      <button
        type='button'
        className='text-muted-foreground hover:text-foreground absolute top-2 left-2 z-10 cursor-grab touch-none active:cursor-grabbing'
        aria-label={`拖动 ${name}`}
        onClick={(e) => e.stopPropagation()}
        {...listeners}
        {...attributes}
      >
        <Icons.gripVertical className='h-4 w-4' />
      </button>
      {children}
    </div>
  );
}
