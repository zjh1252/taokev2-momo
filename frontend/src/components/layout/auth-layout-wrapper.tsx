import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';

/**
 * 认证页面左右分栏布局
 * <p>
 * 左侧：品牌面板（渐变背景 + 背景图 + Logo + 标语）<br/>
 * 右侧：表单内容区（由子页面填充）
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 17:40
 */
export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');

  const sloganParts = t('brand.slogan').split('\n');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <main className="w-full max-w-[960px] min-h-[500px] flex rounded-lg overflow-hidden shadow-2xl bg-white relative">
        {/* 左侧品牌面板 */}
        <section className="hidden md:flex md:w-[45%] bg-gradient-to-br from-[#be0003] to-primary relative flex-col justify-between p-10 overflow-hidden">
          {/* 装饰元素 */}
          <div className="absolute -top-[10%] -right-[10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-[5%] -left-[5%] w-48 h-48 bg-black/10 rounded-full blur-2xl" />

          {/* Logo */}
          <div className="relative z-10">
            <Link href={ROUTES.HOME} className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-lg">
                <GraduationCap className="size-6 text-primary" />
              </div>
              <span className="text-white font-heading font-black text-2xl tracking-tighter">
                淘课网
              </span>
            </Link>
          </div>

          {/* 标语 */}
          <div className="relative z-10 mt-auto">
            <h1 className="text-white font-heading font-extrabold text-3xl leading-tight tracking-tight mb-4">
              {sloganParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < sloganParts.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="text-white/80 text-lg font-medium">
              {t('brand.description')}
            </p>
          </div>

          {/* 底部指示条 */}
          <div className="relative z-10 mt-12 flex gap-4">
            <div className="h-1 w-12 bg-white/40 rounded-full" />
            <div className="h-1 w-4 bg-white/20 rounded-full" />
            <div className="h-1 w-4 bg-white/20 rounded-full" />
          </div>

          {/* 背景图遮罩 */}
          <div className="absolute inset-0 z-0 opacity-[0.15]">
            <Image
              src="/statics/images/auth-bg.jpg"
              alt=""
              fill
              sizes="(max-width: 768px) 0px, 432px"
              className="object-cover"
              priority
            />
          </div>
        </section>

        {/* 右侧表单区 */}
        <section className="w-full md:w-[55%] bg-white p-8 md:p-12 flex flex-col justify-center">
          {/* 移动端 Logo */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <GraduationCap className="size-8 text-primary" />
            <span className="font-heading font-black text-2xl tracking-tighter">
              淘课网
            </span>
          </div>

          {children}
        </section>
      </main>

      {/* 底部版权 */}
      <footer className="fixed bottom-0 w-full py-8 pointer-events-none">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <p className="text-[10px] text-muted-foreground/40 font-medium tracking-widest uppercase">
            {t('footer.copyright')}
          </p>
          <div className="flex gap-6 pointer-events-auto">
            <a
              href="#"
              className="text-[10px] text-muted-foreground/40 font-medium tracking-widest uppercase hover:text-primary transition-colors"
            >
              {t('footer.help')}
            </a>
            <a
              href="#"
              className="text-[10px] text-muted-foreground/40 font-medium tracking-widest uppercase hover:text-primary transition-colors"
            >
              {t('footer.privacy')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
