import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutPageShell } from '@/features/footer/components/about-page-shell';
import { SiteMapPage } from '@/features/footer/components/site-map-page';
import { getAboutPage } from '@/features/footer/content/about-pages';
import { routing } from '@/i18n/routing';
import { buildCanonicalUrl } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const ABOUT_DESCRIPTIONS: Record<string, string> = {
  taoke: '了解淘课网企业培训采购平台的发展定位、服务能力与企业培训资源体系，快速认识淘课如何连接讲师、机构与企业需求。',
  contact: '查看淘课网联系方式、服务热线与商务沟通入口，企业培训采购、课程合作、讲师机构入驻可通过本页联系平台。',
  careers: '淘课网招聘英才页面介绍团队岗位与人才发展机会，欢迎关注企业培训平台相关运营、技术与业务岗位信息。',
  business: '淘课网商务合作页面面向培训机构、讲师、企业与生态伙伴，提供课程资源合作、平台推广与企业培训服务协同入口。',
  ads: '淘课网广告服务页面介绍企业培训行业推广资源，帮助讲师、机构和品牌面向培训采购用户获得更精准展示。',
  terms: '淘课网用户服务协议说明平台服务规则、用户权利义务与交易注意事项，注册登录及使用平台前请阅读相关条款。',
  legal: '淘课网法律声明说明网站内容、知识产权、免责条款与用户使用边界，帮助访问者了解平台合规使用要求。',
  privacy: '淘课网隐私政策说明个人信息收集、使用、保护与用户权利，帮助用户了解平台如何保障账号与隐私安全。',
  help: '淘课网使用帮助汇总注册登录、课程采购、需求发布、讲师机构入驻等常见问题，辅助用户快速完成平台操作。',
  sitemap: '淘课网站点地图汇总公开课、内训课、培训专家、培训机构、案例与城市频道入口，便于用户和搜索引擎浏览全站资源。',
};

export async function generateStaticParams() {
  const slugs = [
    'taoke',
    'contact',
    'careers',
    'business',
    'ads',
    'terms',
    'legal',
    'privacy',
    'help',
    'sitemap',
  ];

  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'sitemap') {
    return {
      title: '站点地图 - 淘课网',
      description: ABOUT_DESCRIPTIONS.sitemap,
      alternates: { canonical: buildCanonicalUrl('/about/sitemap') },
    };
  }

  const page = getAboutPage(slug);
  if (!page) {
    return { title: '页面不存在 - 淘课网', robots: { index: false, follow: false } };
  }
  return {
    title: `${page.title} - 淘课网`,
    description: ABOUT_DESCRIPTIONS[slug] || `${page.title}提供淘课网企业培训平台相关说明，帮助用户了解平台服务、合作方式与网站使用规则。`,
    alternates: { canonical: buildCanonicalUrl(`/about/${slug}`) },
  };
}

/**
 * 底部静态落地页：正文直接抄老站 about HTML
 *
 * @author Fangxinxin
 * @date 2026-07-23 16:20
 */
export default async function AboutStaticPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug === 'sitemap') {
    return <SiteMapPage />;
  }

  const page = getAboutPage(slug);
  if (!page) {
    notFound();
  }

  return <AboutPageShell title={page.title} html={page.html} />;
}
