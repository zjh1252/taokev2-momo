import { redirect } from 'next/navigation';

/**
 * 旧路由 /experts → 重定向到 /trainers
 */
export default function ExpertsRedirect() {
  redirect('/trainers');
}
