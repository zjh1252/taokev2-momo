import { permanentRedirect } from 'next/navigation';

/**
 * 旧路由 /instructors → 永久重定向到 /trainer
 */
export default function InstructorsPage() {
  permanentRedirect('/trainer');
}
