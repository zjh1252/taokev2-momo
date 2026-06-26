import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';

const linkClass = 'hover:text-white transition-colors';

/**
 * 全站深色 Footer — 5 列布局（品牌 + 导航 + 关于/商务 + 法律 + 联系）
 *
 * @author Fangxinxin
 * @date 2026-04-01 17:20
 */
export function AppFooter() {
  const t = useTranslations('home');

  return (
    <footer className="mt-10 bg-[#141414] py-16 text-[#A0A0A0]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* 列 1: 品牌简介 */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold text-xl">
                  淘
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">
                  淘课网
                </span>
              </div>
              <p className="text-white text-[15px] font-medium tracking-wide">
                领先的企业培训采购平台
              </p>
            </div>
            <div className="w-10 h-0.5 bg-primary" />
            <p className="text-[13px] leading-6">{t('footer.companyIntro')}</p>
          </div>

          {/* 列 2: 网站导航 */}
          <div className="flex flex-col gap-5">
            <h3 className="text-white font-bold text-[16px]">网站导航</h3>
            <ul className="flex flex-col gap-3 text-[13px]">
              <li>
                <Link href={ROUTES.HOME} className={linkClass}>
                  淘课网首页
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ARTICLES} className={linkClass}>
                  淘课百科
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ARTICLES} className={linkClass}>
                  《快乐培训》期刊
                </Link>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  DISC性格测评
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  使用帮助
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  站点地图
                </a>
              </li>
            </ul>
          </div>

          {/* 列 3: 关于我们 & 商务服务 */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <h3 className="text-white font-bold text-[16px]">
                {t('footer.aboutUs')}
              </h3>
              <ul className="flex flex-col gap-3 text-[13px]">
                <li>
                  <a href="#" className={linkClass}>
                    {t('footer.aboutCompany')}
                  </a>
                </li>
                <li>
                  <a href="#" className={linkClass}>
                    {t('footer.contactUs')}
                  </a>
                </li>
                <li>
                  <a href="#" className={linkClass}>
                    {t('footer.joinUs')}
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-5">
              <h3 className="text-white font-bold text-[16px]">
                {t('footer.business')}
              </h3>
              <ul className="flex flex-col gap-3 text-[13px]">
                <li>
                  <a href="#" className={linkClass}>
                    {t('footer.partners')}
                  </a>
                </li>
                <li>
                  <a href="#" className={linkClass}>
                    广告服务
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* 列 4: 法律声明 */}
          <div className="flex flex-col gap-5">
            <h3 className="text-white font-bold text-[16px]">法律声明</h3>
            <ul className="flex flex-col gap-3 text-[13px]">
              <li>
                <a href="#" className={linkClass}>
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  法律声明
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  {t('footer.privacy')}
                </a>
              </li>
            </ul>
          </div>

          {/* 列 5: 联系我们 & 二维码 */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-5 w-full">
                <h3 className="text-white font-bold text-[16px]">联系我们</h3>
                <ul className="flex flex-col gap-4 text-[13px]">
                  <li className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center group-hover:bg-[#07C160] transition-colors">
                      <span className="text-white text-xs">微</span>
                    </div>
                    <span>微信公众号</span>
                  </li>
                  <li className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center group-hover:bg-white transition-colors">
                      <span className="text-white group-hover:text-black text-xs">
                        抖
                      </span>
                    </div>
                    <span>官方抖音号</span>
                  </li>
                  <li className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center group-hover:bg-[#FF2442] transition-colors">
                      <span className="text-white text-[10px] font-bold">
                        小红书
                      </span>
                    </div>
                    <span>官方小红书</span>
                  </li>
                </ul>
              </div>

              {/* 二维码占位 */}
              <div className="shrink-0 bg-white p-2 rounded-md mt-10">
                <div className="w-24 h-24 bg-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                  QR Code
                </div>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-white text-[24px] font-bold mb-3">
                400-169-7929
              </div>
            </div>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-12 pt-6 border-t border-[#333] text-center text-[12px] text-[#888] flex flex-col md:flex-row justify-center items-center gap-4">
          <span>{t('footer.copyright')}</span>
          <a href="#" className={linkClass}>
            上海淘课企业管理咨询有限公司 版权所有
          </a>
          <span>{t('footer.icp')}</span>
        </div>
      </div>
    </footer>
  );
}
