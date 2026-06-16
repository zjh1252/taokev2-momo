'use client';

import { useState } from 'react';

interface UserDropdownProps {
  user: {
    name: string;
    avatar?: string;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>
        {user.name}
      </button>
      {/* TODO: 下拉菜单内容 */}
    </div>
  );
}
