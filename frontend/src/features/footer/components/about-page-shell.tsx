import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';

type AboutPageShellProps = {
  title: string;
  /** 老站原文 HTML */
  html: string;
  related?: Array<{ label: string; href: string }>;
};

const DEFAULT_RELATED = [
  { label: '关于淘课', href: ROUTES.ABOUT_TAOKE },
  { label: '联系我们', href: ROUTES.ABOUT_CONTACT },
  { label: '服务条款', href: ROUTES.ABOUT_TERMS },
  { label: '法律声明', href: ROUTES.ABOUT_LEGAL },
  { label: '隐私保护', href: ROUTES.ABOUT_PRIVACY },
];

/**
 * 底部静态页统一壳：标题区 + 老站原文 HTML + 相关入口
 *
 * @author Fangxinxin
 * @date 2026-07-23 16:20
 */
export function AboutPageShell({
  title,
  html,
  related = DEFAULT_RELATED,
}: AboutPageShellProps) {
  return (
    <div className="bg-[var(--page-bg)]">
      <div className="border-b border-border/60 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
          <p className="mb-3 text-sm text-muted-foreground">
            <Link href={ROUTES.HOME} className="hover:text-primary">
              首页
            </Link>
            <span className="mx-2 text-border">/</span>
            <span>{title}</span>
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <div className="mt-6 h-1 w-12 rounded-full bg-primary" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <article
          className="about-legacy-html max-w-none text-[15px] leading-8 text-foreground/85 [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_img]:mx-auto [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_p]:my-3 [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <aside className="mt-14 rounded-xl border border-border/70 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">相关页面</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {related
              .filter((item) => item.label !== title)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
