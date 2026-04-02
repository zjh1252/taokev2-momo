import { redirect } from 'next/navigation';

/**
 * 旧路由 /instructors → 重定向到 /experts
 */
export default function InstructorsPage() {
  redirect('/experts');
}
