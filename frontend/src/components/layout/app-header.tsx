import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
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

/**
 * 主导航栏 — 毛玻璃背景、Logo 图片、导航链接、搜索栏
 * <p>用户认证区域已移至顶部辅助导航栏 TopNavBar</p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 17:00
 */
export function AppHeader() {
  const t = useTranslations('nav');

  return (
    <nav className="h-[80px] w-full bg-white/90 backdrop-blur-md sticky top-[29px] z-40 shadow-sm px-8 flex flex-col justify-center transition-all duration-300">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between h-full">
        {/* 左侧：Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href={ROUTES.HOME} className="flex flex-col">
            <Image
              src="/statics/images/taokelogo.jpg"
              alt="淘课网"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* 中间：主导航链接 */}
        <div className="hidden lg:flex items-center gap-8 shrink-0">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-slate-600 font-medium hover:text-primary transition-colors text-[15px]"
            >
              {t(key)}
            </Link>
          ))}
        </div>

        {/* 右侧：搜索栏（拉满剩余空间） */}
        <div className="flex items-center ml-4 flex-1 max-w-xs justify-end">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}
