import { Link } from '@/i18n/navigation';

function BreadcrumbSeparator({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/**
 * 面包屑单项
 *
 * <ul>
 *   <li>label：显示文案，必填</li>
 *   <li>href：可点击跳转目标。不传则该项视为「当前页」，纯文本展示，加深色</li>
 *   <li>hardNav：true 时用原生 &lt;a&gt; 整页跳转（SEO .htm 需走 proxy rewrite）</li>
 * </ul>
 */
export type BreadcrumbItem = {
  label: string;
  href?: string;
  /** 使用整页导航，确保 middleware/proxy 重写生效 */
  hardNav?: boolean;
};

type PageBreadcrumbProps = {
  /** 路径项（不含开头的「首页」与「你的位置：」前缀，组件会自动补齐） */
  items: BreadcrumbItem[];
  /** 是否显示「你的位置：」前缀，默认 true */
  showPrefix?: boolean;
  /** 是否显示开头的「首页」项（带链接到 /），默认 true */
  includeHome?: boolean;
  /** 额外 className，便于业务侧调整间距 */
  className?: string;
};

/**
 * 公共面包屑组件 — 统一样式「你的位置：首页 > 列表页 > 详情」
 *
 * <p>使用示例：</p>
 * <pre>
 * // 列表页：你的位置：首页 > 培训专家
 * &lt;PageBreadcrumb items={[{ label: '培训专家' }]} /&gt;
 *
 * // 详情页：你的位置：首页 > 培训专家 > 张三
 * &lt;PageBreadcrumb items={[
 *   { label: '培训专家', href: '/trainers' },
 *   { label: '张三' },
 * ]} /&gt;
 * </pre>
 *
 * @author Fangxinxin
 * @date 2026-05-20 16:00
 */
export function PageBreadcrumb({
  items,
  showPrefix = true,
  includeHome = true,
  className = '',
}: PageBreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={`flex text-sm text-slate-500 gap-2 items-center ${className}`}
    >
      {showPrefix ? <span>你的位置：</span> : null}

      {includeHome ? (
        <>
          <Link href="/" className="hover:text-primary transition-colors">
            首页
          </Link>
          {items.length > 0 ? <BreadcrumbSeparator className="size-4" /> : null}
        </>
      ) : null}

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              item.hardNav ? (
                <a href={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              )
            ) : (
              <span className="text-slate-800 font-medium">{item.label}</span>
            )}
            {!isLast ? <BreadcrumbSeparator className="size-4" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
