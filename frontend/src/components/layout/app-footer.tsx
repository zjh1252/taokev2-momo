import { Link } from '@/i18n/navigation';
import {
  FOOTER_ABOUT_LINKS,
  FOOTER_BRAND,
  FOOTER_BUSINESS_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_NAV_LINKS,
  type FooterNavItem,
} from '@/features/footer/constants/footer-links';
import { FooterContactSocial } from '@/features/footer/components/footer-contact-social';

const linkClass = 'hover:text-white transition-colors';

function NavList({ items }: { items: FooterNavItem[] }) {
  return (
    <ul className="flex flex-col gap-3 text-[13px]">
      {items.map((item) => (
        <li key={`${item.label}-${item.href}`}>
          {item.external ? (
            <a
              href={item.href}
              className={linkClass}
              {...(item.openInNewTab === false
                ? { rel: 'nofollow' }
                : { target: '_blank', rel: 'nofollow noopener noreferrer' })}
            >
              {item.label}
            </a>
          ) : (
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * 全站深色 Footer — 链接写死；站内页正文抄老站，期刊/DISC 外链
 *
 * @author Fangxinxin
 * @date 2026-07-23 17:20
 */
export function AppFooter() {
  return (
    <footer className="mt-10 bg-[#141414] py-16 text-[#A0A0A0]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-xl font-bold text-white">
                  淘
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">淘课网</span>
              </div>
              <p className="text-[15px] font-medium tracking-wide text-white">
                {FOOTER_BRAND.tagline}
              </p>
            </div>
            <div className="h-0.5 w-10 bg-primary" />
            <p className="text-[13px] leading-6">{FOOTER_BRAND.intro}</p>
          </div>

          <div className="flex flex-col gap-5">
            <h3 className="text-[16px] font-bold text-white">网站导航</h3>
            <NavList items={FOOTER_NAV_LINKS} />
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <h3 className="text-[16px] font-bold text-white">关于我们</h3>
              <NavList items={FOOTER_ABOUT_LINKS} />
            </div>
            <div className="flex flex-col gap-5">
              <h3 className="text-[16px] font-bold text-white">商务服务</h3>
              <NavList items={FOOTER_BUSINESS_LINKS} />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h3 className="text-[16px] font-bold text-white">法律声明</h3>
            <NavList items={FOOTER_LEGAL_LINKS} />
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <FooterContactSocial />
            <div className="mt-2">
              <div className="mb-3 text-[24px] font-bold text-white">{FOOTER_BRAND.phone}</div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-[#333] pt-6 text-center text-[12px] text-[#888] md:flex-row">
          <span>{FOOTER_BRAND.copyright}</span>
          <span>{FOOTER_BRAND.company}</span>
          <span>{FOOTER_BRAND.icp}</span>
        </div>
      </div>
    </footer>
  );
}
