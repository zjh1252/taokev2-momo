import { describe, expect, it } from 'vitest';
import type { CategoryTreeNode } from '../types';
import {
  isUniqueExpertiseLeafName,
  joinFieldValue,
  resolveExpertiseCategoryId,
  splitFieldForFilter,
} from './expertise-categories';
import { canonicalizeTrainerSlugField, filtersToHtmPath, parseTrainerListPathname } from './url';

const tree: CategoryTreeNode[] = [
  {
    id: 1,
    name: '经营战略',
    level: 1,
    sortOrder: 1,
    children: [
      { id: 11, name: '战略规划', level: 2, sortOrder: 1 },
      { id: 12, name: '商业模式', level: 2, sortOrder: 2 },
    ],
  },
  {
    id: 2,
    name: '领导力',
    level: 1,
    sortOrder: 2,
    children: [
      { id: 21, name: '战略规划', level: 2, sortOrder: 1 }, // 与经营战略下重名
      { id: 22, name: '高管领导力', level: 2, sortOrder: 2 },
    ],
  },
  {
    id: 3,
    name: 'MBA/总裁班',
    level: 1,
    sortOrder: 3,
    children: [],
  },
];

describe('isUniqueExpertiseLeafName', () => {
  it('unique leaf is unique', () => {
    expect(isUniqueExpertiseLeafName(tree, '高管领导力')).toBe(true);
    expect(isUniqueExpertiseLeafName(tree, '商业模式')).toBe(true);
  });

  it('duplicate leaf across L1 is not unique', () => {
    expect(isUniqueExpertiseLeafName(tree, '战略规划')).toBe(false);
  });

  it('L1 name is not a leaf unique check target (count 0 leaves)', () => {
    expect(isUniqueExpertiseLeafName(tree, '经营战略')).toBe(false);
  });
});

describe('joinFieldValue', () => {
  it('L1 only', () => {
    expect(joinFieldValue('经营战略', null, tree)).toBe('经营战略');
  });

  it('unique L2 uses leaf only', () => {
    expect(joinFieldValue('领导力', '高管领导力', tree)).toBe('高管领导力');
  });

  it('duplicate L2 keeps parent_child', () => {
    expect(joinFieldValue('经营战略', '战略规划', tree)).toBe('经营战略_战略规划');
    expect(joinFieldValue('领导力', '战略规划', tree)).toBe('领导力_战略规划');
  });
});

describe('resolveExpertiseCategoryId', () => {
  it('resolves unique L2-only slug', () => {
    expect(resolveExpertiseCategoryId(tree, '高管领导力')).toBe(22);
  });

  it('resolves L1', () => {
    expect(resolveExpertiseCategoryId(tree, '经营战略')).toBe(1);
    expect(resolveExpertiseCategoryId(tree, 'MBA/总裁班')).toBe(3);
  });

  it('resolves parent_child', () => {
    expect(resolveExpertiseCategoryId(tree, '经营战略_战略规划')).toBe(11);
    expect(resolveExpertiseCategoryId(tree, '领导力_战略规划')).toBe(21);
  });

  it('ambiguous L2-only picks first leaf in tree order', () => {
    expect(resolveExpertiseCategoryId(tree, '战略规划')).toBe(11);
  });
});

describe('splitFieldForFilter', () => {
  it('expands unique L2 to parent+child', () => {
    expect(splitFieldForFilter(tree, '高管领导力')).toEqual({
      fieldParentName: '领导力',
      fieldChildName: '高管领导力',
    });
  });

  it('keeps L1 only', () => {
    expect(splitFieldForFilter(tree, '经营战略')).toEqual({
      fieldParentName: '经营战略',
      fieldChildName: undefined,
    });
  });

  it('parses parent_child', () => {
    expect(splitFieldForFilter(tree, '经营战略_战略规划')).toEqual({
      fieldParentName: '经营战略',
      fieldChildName: '战略规划',
    });
  });
});

describe('canonicalizeTrainerSlugField', () => {
  it('301 candidate: unique L2 from parent_child', () => {
    expect(canonicalizeTrainerSlugField(tree, '领导力_高管领导力')).toBe('高管领导力');
  });

  it('no change when duplicate L2', () => {
    expect(canonicalizeTrainerSlugField(tree, '经营战略_战略规划')).toBeNull();
  });

  it('no change when already L2-only or L1', () => {
    expect(canonicalizeTrainerSlugField(tree, '高管领导力')).toBeNull();
    expect(canonicalizeTrainerSlugField(tree, '经营战略')).toBeNull();
  });

  it('filtersToHtmPath builds L2-only path', () => {
    expect(filtersToHtmPath({ field: '高管领导力', industry: '软件' })).toBe(
      `/trainer/field=${encodeURIComponent('高管领导力')}&industry=${encodeURIComponent('软件')}.htm`,
    );
  });
});

describe('parseTrainerListPathname', () => {
  it('parses empty list path', () => {
    expect(parseTrainerListPathname('/trainer')).toEqual({});
  });

  it('parses field/industry/region/page from .htm path', () => {
    expect(
      parseTrainerListPathname(
        `/trainer/field=${encodeURIComponent('客户服务')}&industry=${encodeURIComponent('软件')}&region=${encodeURIComponent('上海')}&page=2.htm`,
      ),
    ).toEqual({
      field: '客户服务',
      industry: '软件',
      region: '上海',
      page: 2,
    });
  });

  it('accepts already-decoded pathname and locale prefix', () => {
    expect(parseTrainerListPathname('/zh-CN/trainer/field=客户服务.htm')).toEqual({
      field: '客户服务',
    });
  });
});
