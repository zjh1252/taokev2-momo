import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { resolveApiImageSrc } from '@/lib/media';
import type { FooterLinkItem, PublicFooterData } from '@/features/footer/api/types';

const linkClass = 'hover:text-white transition-colors';

function FooterNavLink({ item }: { item: FooterLinkItem }) {
  if (!item.href) {
    return <span className={linkClass}>{item.label}</span>;
  }

  if (item.linkType === 'EXTERNAL' || item.href.startsWith('http')) {
    return (
      <a
        href={item.href}
        className={linkClass}
        target={item.openInNewTab ? '_blank' : undefined}
        rel={item.openInNewTab ? 'noreferrer noopener' : undefined}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={linkClass}>
      {item.label}
    </Link>
  );
}

function SocialIcon({ iconKey }: { iconKey?: string | null }) {
  if (iconKey === 'wechat') {
    return (
      <div className='w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center group-hover:bg-[#07C160] transition-colors'>
        <span className='text-white text-xs'>微</span>
      </div>
    );
  }
  if (iconKey === 'douyin') {
    return (
      <div className='w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center group-hover:bg-white transition-colors'>
        <span className='text-white group-hover:text-black text-xs'>抖</span>
      </div>
    );
  }
  if (iconKey === 'xiaohongshu') {
    return (
      <div className='w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center group-hover:bg-[#FF2442] transition-colors'>
        <span className='text-white text-[10px] font-bold'>小红书</span>
      </div>
    );
  }
  return null;
}

export function FooterView({ data }: { data: PublicFooterData }) {
  const { config, sections } = data;
  const navLinks = sections.NAV ?? [];
  const aboutLinks = sections.ABOUT ?? [];
  const businessLinks = sections.BUSINESS ?? [];
  const legalLinks = sections.LEGAL ?? [];
  const contactLinks = sections.CONTACT ?? [];
  const mainQr = config.mainQrImageUrl ? resolveApiImageSrc(config.mainQrImageUrl) : null;

  return (
    <footer className='mt-10 bg-[#141414] py-16 text-[#A0A0A0]'>
      <div className='max-w-[1400px] mx-auto px-6 lg:px-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8'>
          <div className='lg:col-span-1 flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <div className='w-10 h-10 bg-primary rounded flex items-center justify-center text-white font-bold text-xl'>
                  淘
                </div>
                <span className='text-2xl font-black tracking-tighter text-white'>淘课网</span>
              </div>
              <p className='text-white text-[15px] font-medium tracking-wide'>{config.brandTagline}</p>
            </div>
            <div className='w-10 h-0.5 bg-primary' />
            <p className='text-[13px] leading-6'>{config.companyIntro}</p>
          </div>

          <div className='flex flex-col gap-5'>
            <h3 className='text-white font-bold text-[16px]'>网站导航</h3>
            <ul className='flex flex-col gap-3 text-[13px]'>
              {navLinks.map((item) => (
                <li key={item.itemCode}>
                  <FooterNavLink item={item} />
                </li>
              ))}
            </ul>
          </div>

          <div className='flex flex-col gap-8'>
            <div className='flex flex-col gap-5'>
              <h3 className='text-white font-bold text-[16px]'>关于我们</h3>
              <ul className='flex flex-col gap-3 text-[13px]'>
                {aboutLinks.map((item) => (
                  <li key={item.itemCode}>
                    <FooterNavLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
            <div className='flex flex-col gap-5'>
              <h3 className='text-white font-bold text-[16px]'>商务服务</h3>
              <ul className='flex flex-col gap-3 text-[13px]'>
                {businessLinks.map((item) => (
                  <li key={item.itemCode}>
                    <FooterNavLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className='flex flex-col gap-5'>
            <h3 className='text-white font-bold text-[16px]'>法律声明</h3>
            <ul className='flex flex-col gap-3 text-[13px]'>
              {legalLinks.map((item) => (
                <li key={item.itemCode}>
                  <FooterNavLink item={item} />
                </li>
              ))}
            </ul>
          </div>

          <div className='lg:col-span-1 flex flex-col gap-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex flex-col gap-5 w-full'>
                <h3 className='text-white font-bold text-[16px]'>联系我们</h3>
                <ul className='flex flex-col gap-4 text-[13px]'>
                  {contactLinks.map((item) => {
                    const qrSrc = resolveApiImageSrc(item.qrImageUrl);
                    return (
                      <li key={item.itemCode} className='flex items-center gap-2 group'>
                        <SocialIcon iconKey={item.iconKey} />
                        {item.href ? (
                          <FooterNavLink item={item} />
                        ) : (
                          <span className='group-hover:text-white transition-colors'>{item.label}</span>
                        )}
                        {qrSrc ? (
                          <Image
                            src={qrSrc}
                            alt={item.label}
                            width={64}
                            height={64}
                            className='ml-auto rounded border border-white/10'
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className='shrink-0 bg-white p-2 rounded-md mt-10'>
                {mainQr ? (
                  <Image src={mainQr} alt='二维码' width={96} height={96} className='object-cover' />
                ) : (
                  <div className='w-24 h-24 bg-slate-200 flex items-center justify-center text-[10px] text-slate-400'>
                    QR Code
                  </div>
                )}
              </div>
            </div>

            <div className='mt-2'>
              <div className='text-white text-[24px] font-bold mb-3'>{config.phone}</div>
            </div>
          </div>
        </div>

        <div className='mt-12 pt-6 border-t border-[#333] text-center text-[12px] text-[#888] flex flex-col md:flex-row justify-center items-center gap-4'>
          <span>{config.copyrightText}</span>
          {config.companyCopyrightUrl ? (
            <a href={config.companyCopyrightUrl} className={linkClass}>
              {config.companyCopyrightText}
            </a>
          ) : (
            <span>{config.companyCopyrightText}</span>
          )}
          <span>{config.icpText}</span>
        </div>
      </div>
    </footer>
  );
}
