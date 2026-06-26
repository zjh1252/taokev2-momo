import { NotFoundContent } from './not-found-content';
import '@/styles/globals.css';

/**
 * 根级 404 兜底 — 未命中任何 locale 路由时使用。
 * 自带 html/body 与全局样式（根 layout 仅透传 children）。
 *
 * @author Fangxinxin
 * @date 2026-06-09 17:30
 */
export default function RootNotFound() {
  return (
    <html lang="zh-CN">
      <body className="min-h-full font-sans antialiased">
        <NotFoundContent />
      </body>
    </html>
  );
}
