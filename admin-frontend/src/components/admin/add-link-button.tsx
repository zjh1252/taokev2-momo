import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export function AddLinkButton({
  href,
  label = '添加'
}: {
  href: string;
  label?: string;
}) {
  return (
    <Button asChild>
      <Link href={href}>
        <Icons.add className='mr-2 h-4 w-4' />
        {label}
      </Link>
    </Button>
  );
}
