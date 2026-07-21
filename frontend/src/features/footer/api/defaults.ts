import type { PublicFooterData } from './types';

export const DEFAULT_FOOTER_DATA: PublicFooterData = {
  config: {
    brandTagline: '领先的企业培训采购平台',
    companyIntro:
      '淘课网联合全国数万优秀培训师和培训机构,给企业提供有针对性的、互动的、积聚人脉的管理培训服务.包括提供培训需求诊断、培训课程采购、培训资料下载等服务！',
    phone: '400-169-7929',
    copyrightText: 'Copyright(C) 2006-2024 TAOKE.com All Rights Reserved.',
    companyCopyrightText: '上海淘课企业管理咨询有限公司 版权所有',
    icpText: '沪ICP备05034964号'
  },
  sections: {
    NAV: [
      { id: 0, sectionCode: 'NAV', itemCode: 'HOME', label: '淘课网首页', linkType: 'INTERNAL', linkTarget: '/', href: '/', sortOrder: 60, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'NAV', itemCode: 'ENCYCLOPEDIA', label: '淘课百科', linkType: 'INTERNAL', linkTarget: '/articles', href: '/articles', sortOrder: 50, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'NAV', itemCode: 'HAPPY_TRAINING_JOURNAL', label: '《快乐培训》期刊', linkType: 'STATIC_PAGE', linkTarget: 'HAPPY_TRAINING_JOURNAL', href: '/pages/happy-training-journal', sortOrder: 40, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'NAV', itemCode: 'DISC_ASSESSMENT', label: 'DISC性格测评', linkType: 'STATIC_PAGE', linkTarget: 'DISC_ASSESSMENT', href: '/pages/disc-assessment', sortOrder: 30, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'NAV', itemCode: 'HELP', label: '使用帮助', linkType: 'STATIC_PAGE', linkTarget: 'HELP', href: '/pages/help', sortOrder: 20, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'NAV', itemCode: 'SITEMAP', label: '站点地图', linkType: 'STATIC_PAGE', linkTarget: 'SITEMAP', href: '/pages/sitemap', sortOrder: 10, enabled: true, openInNewTab: false }
    ],
    ABOUT: [
      { id: 0, sectionCode: 'ABOUT', itemCode: 'ABOUT_TAOKE', label: '关于淘课', linkType: 'STATIC_PAGE', linkTarget: 'ABOUT_TAOKE', href: '/pages/about-taoke', sortOrder: 30, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'ABOUT', itemCode: 'CONTACT_US', label: '联系我们', linkType: 'STATIC_PAGE', linkTarget: 'CONTACT_US', href: '/pages/contact-us', sortOrder: 20, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'ABOUT', itemCode: 'CAREERS', label: '招聘英才', linkType: 'STATIC_PAGE', linkTarget: 'CAREERS', href: '/pages/careers', sortOrder: 10, enabled: true, openInNewTab: false }
    ],
    BUSINESS: [
      { id: 0, sectionCode: 'BUSINESS', itemCode: 'BUSINESS_COOPERATION', label: '商务合作', linkType: 'STATIC_PAGE', linkTarget: 'BUSINESS_COOPERATION', href: '/pages/business-cooperation', sortOrder: 20, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'BUSINESS', itemCode: 'AD_SERVICE', label: '广告服务', linkType: 'STATIC_PAGE', linkTarget: 'AD_SERVICE', href: '/pages/ad-service', sortOrder: 10, enabled: true, openInNewTab: false }
    ],
    LEGAL: [
      { id: 0, sectionCode: 'LEGAL', itemCode: 'TERMS_OF_SERVICE', label: '服务条款', linkType: 'STATIC_PAGE', linkTarget: 'TERMS_OF_SERVICE', href: '/pages/terms-of-service', sortOrder: 30, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'LEGAL', itemCode: 'LEGAL_NOTICE', label: '法律声明', linkType: 'STATIC_PAGE', linkTarget: 'LEGAL_NOTICE', href: '/pages/legal-notice', sortOrder: 20, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'LEGAL', itemCode: 'PRIVACY_POLICY', label: '隐私保护', linkType: 'STATIC_PAGE', linkTarget: 'PRIVACY_POLICY', href: '/pages/privacy-policy', sortOrder: 10, enabled: true, openInNewTab: false }
    ],
    CONTACT: [
      { id: 0, sectionCode: 'CONTACT', itemCode: 'WECHAT', label: '微信公众号', linkType: 'NONE', iconKey: 'wechat', sortOrder: 30, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'CONTACT', itemCode: 'DOUYIN', label: '官方抖音号', linkType: 'NONE', iconKey: 'douyin', sortOrder: 20, enabled: true, openInNewTab: false },
      { id: 0, sectionCode: 'CONTACT', itemCode: 'XIAOHONGSHU', label: '官方小红书', linkType: 'NONE', iconKey: 'xiaohongshu', sortOrder: 10, enabled: true, openInNewTab: false }
    ]
  }
};
