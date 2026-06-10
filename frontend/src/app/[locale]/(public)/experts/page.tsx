import { redirect } from 'next/navigation';

/**
 * 旧路由 /experts → 重定向到 /trainer
 */
export default function ExpertsRedirect() {
  redirect('/trainer');
}
