import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { HeaderAuth } from './header-auth';
import { ProductDropdown } from './product-dropdown';
import { SearchBar } from './search-bar';

/** 主导航链接配置 */
const NAV_LINKS = [
  { key: 'home', href: ROUTES.HOME },
  { key: 'experts', href: ROUTES.EXPERTS },
  { key: 'publicCourses', href: ROUTES.PUBLIC_COURSES },
  { key: 'internalCourses', href: ROUTES.INTERNAL_COURSES },
  { key: 'onlineCourses', href: ROUTES.ONLINE_COURSES },
  { key: 'institutions', href: ROUTES.INSTITUTIONS },
] as const;

export function AppHeader() {
  const t = useTranslations('nav');

  return (
    <nav className="h-[80px] w-full bg-white sticky top-0 z-50 shadow-sm px-8 flex flex-col justify-center">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between h-full">
        {/* ── 左侧：Logo + 培训宝下拉 ── */}
        <div className="flex items-center gap-6">
          <Link href={ROUTES.HOME} className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-primary font-heading">
              淘课网
            </span>
            <span className="text-[10px] text-primary font-bold tracking-widest leading-tight">
              找得到，信得过！
            </span>
          </Link>
          <ProductDropdown />
        </div>

        {/* ── 中间：主导航链接 ── */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-muted-foreground font-medium hover:text-primary
                         transition-colors text-[15px]"
            >
              {t(key)}
            </Link>
          ))}
        </div>

        {/* ── 右侧：搜索 + 登录/注册 ── */}
        <div className="flex items-center gap-4">
          <SearchBar />
          <div className="ml-2">
            <HeaderAuth />
          </div>
        </div>
      </div>
    </nav>
  );
}
