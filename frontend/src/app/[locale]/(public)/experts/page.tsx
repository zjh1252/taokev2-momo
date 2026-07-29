import { permanentRedirect } from 'next/navigation';

/**
 * 旧路由 /experts → 永久重定向到 /trainer
 */
export default function ExpertsRedirect() {
  permanentRedirect('/trainer');
}
