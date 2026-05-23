import { redirect } from 'next/navigation';

// 后台管理系统不开放自助注册：访问 /register 直接重定向到登录页。
// 原注册页实现保留在同目录 register-page.kept.tsx，如需恢复把其内容搬回本文件即可。
export default function RegisterPage() {
  redirect('/login');
}
