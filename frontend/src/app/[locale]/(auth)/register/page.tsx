import { redirect } from 'next/navigation';

/**
 * 注册页 — 因采用"一键登录/注册"模式（后端 /auth/login/sms 自动创建账号），
 * 注册页直接重定向到登录页。
 */
export default function RegisterPage() {
  redirect('/login');
}
