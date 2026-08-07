import { describe, expect, it } from 'vitest';
import {
  SEO_DESCRIPTION_FALLBACK,
  SEO_DESCRIPTION_MAX,
  SEO_DESCRIPTION_MIN,
  normalizeSeoDescription,
  preferSeoDescription,
  truncateDescription,
} from './helpers';
import {
  buildHomeMetadata,
  buildInnerCourseDetailMetadata,
  buildInstitutionDetailMetadata,
  buildOpenCourseDetailMetadata,
  buildTrainerDetailMetadata,
  buildVideoDetailMetadata,
} from './metadata';
import type { CourseDetail } from '@/features/course/api/types';
import type { InstitutionDetail } from '@/features/institution/types';
import type { TrainerDetail } from '@/features/trainer/types';
import type { VideoDetail } from '@/features/video/api/types';

function assertDesc(desc: string) {
  expect(desc.length).toBeGreaterThan(0);
  expect(desc.length).toBeGreaterThanOrEqual(SEO_DESCRIPTION_MIN);
  expect(desc.length).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX);
}

describe('seo helpers', () => {
  it('prefers custom seo description when provided', () => {
    const custom =
      '这是一条足够长的自定义SEO描述文案，用于验证后台自定义优先于模板自动生成，并且长度满足验收区间。';
    const result = preferSeoDescription(custom);
    expect(result.startsWith('这是一条足够长的自定义SEO描述文案')).toBe(true);
    assertDesc(result);
  });

  it('falls back to template and truncates to seo length budget', () => {
    const longText =
      '淘课网提供企业培训课程、讲师和机构信息，帮助企业快速筛选适合的培训资源，并且为不同类型的详情页提供更完整的描述文案，还会继续补充更多说明。';

    expect(preferSeoDescription(undefined, longText).length).toBeLessThanOrEqual(
      SEO_DESCRIPTION_MAX,
    );
    expect(truncateDescription(longText, SEO_DESCRIPTION_MAX).length).toBeLessThanOrEqual(
      SEO_DESCRIPTION_MAX,
    );
  });

  it('pads short text to at least 60 chars and never returns empty', () => {
    expect(normalizeSeoDescription('')).toBe(
      truncateDescription(SEO_DESCRIPTION_FALLBACK, SEO_DESCRIPTION_MAX),
    );
    const padded = normalizeSeoDescription('短描述');
    assertDesc(padded);
    expect(padded.includes('短描述')).toBe(true);
  });
});

describe('seo detail templates', () => {
  it('home uses fixed copy within length budget', () => {
    const meta = buildHomeMetadata();
    expect(meta.description).toContain('淘课网汇聚企业培训讲师');
    assertDesc(normalizeSeoDescription(meta.description));
  });

  it('trainer detail template fills name and field', () => {
    const trainer = {
      id: 1,
      name: '张三',
      teachingName: '',
      oneLineIntro: '',
      title: '',
      expertiseCategories: [{ categoryName: '领导力' }],
    } as unknown as TrainerDetail;
    const meta = buildTrainerDetailMetadata(trainer);
    expect(meta.description).toContain('张三');
    expect(meta.description).toContain('领导力');
    assertDesc(meta.description);
  });

  it('open course detail template fills name/target/field', () => {
    const course = {
      title: '非财务经理的财务管理',
      audience: '中高层管理者',
      categoryName: '财务管理',
    } as CourseDetail;
    const meta = buildOpenCourseDetailMetadata(course);
    expect(meta.description).toContain('非财务经理的财务管理');
    expect(meta.description).toContain('中高层管理者');
    expect(meta.description).toContain('财务管理');
    assertDesc(meta.description);
  });

  it('video detail template fills name/field/target', () => {
    const video = {
      title: '高效沟通技巧',
      categoryName: '职业素养',
      videoTypeLabel: '职场新人',
      keywords: '沟通,表达',
    } as VideoDetail;
    const meta = buildVideoDetailMetadata(video);
    expect(meta.description).toContain('高效沟通技巧');
    expect(meta.description).toContain('职业素养');
    expect(meta.description).toContain('职场新人');
    assertDesc(meta.description);
  });

  it('inner course detail template fills name/target/field', () => {
    const course = {
      title: '团队领导力内训',
      audience: '一线主管',
      categoryName: '领导力',
    } as CourseDetail;
    const meta = buildInnerCourseDetailMetadata(course);
    expect(meta.description).toContain('团队领导力内训');
    expect(meta.description).toContain('一线主管');
    expect(meta.description).toContain('领导力');
    assertDesc(meta.description);
  });

  it('institution detail template fills name and field', () => {
    const institution = {
      orgName: '某某培训机构',
      specialties: '市场营销',
    } as InstitutionDetail;
    const meta = buildInstitutionDetailMetadata(institution);
    expect(meta.description).toContain('某某培训机构');
    expect(meta.description).toContain('市场营销');
    assertDesc(meta.description);
  });

  it('custom seoDescription wins over template', () => {
    const custom =
      '后台自定义机构SEO描述，用于验证优先级高于模板自动生成，并保证长度达到验收标准要求。';
    const institution = {
      orgName: '某某培训机构',
      specialties: '市场营销',
      seoDescription: custom,
    } as InstitutionDetail;
    const meta = buildInstitutionDetailMetadata(institution);
    expect(meta.description.startsWith('后台自定义机构SEO描述')).toBe(true);
    assertDesc(meta.description);
  });
});
