'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';

export function HeaderLogo() {
  return (
    <Link href={ROUTES.HOME} className="flex items-center gap-2 shrink-0">
      <Image
        src="/statics/images/taoke-new-logo.jpg"
        alt="淘课网 Logo"
        width={40}
        height={40}
        className="size-10 rounded-md object-contain"
        priority
      />
      <span className="hidden text-xl font-black tracking-tighter text-slate-900 sm:inline md:text-2xl">淘课网</span>
    </Link>
  );
}
