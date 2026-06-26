import type {
  MockCourse,
  MockCase,
  MockClip,
  MockReview,
  MockBook,
  MockRelatedTrainer,
} from '../types';

/** 主讲课程 mock */
export const mockCourses: MockCourse[] = [
  {
    id: 1,
    type: 'copyright',
    title: '《战略执行力：从规划到落地》',
    target: '中高层管理者、业务负责人',
    duration: '2天/3天',
    description:
      '本课程旨在帮助企业中高层管理者掌握战略解码与执行的核心方法，通过"战略-组织-人才-机制"四位一体的框架，将宏观战略转化为可落地的行动计划与绩效指标。',
  },
  {
    id: 2,
    type: 'internal',
    title: '《组织能力建设与干部梯队培养》',
    target: 'HR总监、HRBP、企业高管',
    duration: '2天',
    description:
      '聚焦组织能力提升，从干部标准建立、人才盘点、梯队建设到培养项目设计，提供一套系统化的干部管理实操工具，打造支撑业务增长的人才引擎。',
  },
  {
    id: 3,
    type: 'internal',
    title: '《跨部门沟通与高效协同》',
    target: '全体员工、基层管理者',
    duration: '1天',
    description:
      '打破部门墙，通过沙盘模拟和案例分析，帮助学员掌握跨部门沟通的技巧与策略，建立"以客户为中心"的内部协同机制，提升整体运营效率。',
  },
];

/** 授课案例 mock */
export const mockCases: MockCase[] = [
  {
    id: 1,
    title: '某制造企业中层管理者能力提升项目',
    description: '覆盖120位中层干部，三个月内完成目标分解与流程协同机制重建。',
    image: '/statics/images/case-1.jpg',
    industry: '先进制造',
    course: '《组织能力建设与干部梯队培养》',
  },
  {
    id: 2,
    title: '某连锁零售组织变革与店长赋能项目',
    description: '聚焦区域经理与店长梯队建设，门店运营效率提升21%。',
    image: '/statics/images/case-2.jpg',
    industry: '消费零售',
    course: '《组织能力建设与干部梯队培养》',
  },
  {
    id: 3,
    title: '某互联网大厂战略目标落地共创营',
    description: '引导核心管理层对齐年度战略，产出关键战役地图与考核指标。',
    image: '/statics/images/expert-main.jpg',
    industry: '互联网',
    course: '《战略执行力：从规划到落地》',
  },
];

/** 录播课/精彩片段 mock */
export const mockClips: MockClip[] = [
  {
    id: 1,
    type: 'video',
    title: '战略解码工作坊：从目标到行动',
    image: '/statics/images/case-1.jpg',
    duration: '03:45',
    lessons: '12课时',
    price: '¥ 199.00',
  },
  {
    id: 2,
    type: 'article',
    title: '组织协同机制设计：跨部门协作指南',
    image: '/statics/images/case-2.jpg',
    lessons: '共 8 节',
    price: '¥ 99.00',
  },
  {
    id: 3,
    type: 'video',
    title: '管理复盘方法：闭环改进与复制',
    image: '/statics/images/expert-main.jpg',
    duration: '02:15',
    lessons: '6课时',
    price: '免费',
  },
];

/** 学员评价 mock */
export const mockReviews: MockReview[] = [
  {
    id: 1,
    username: 'JJ****61',
    role: '培训经理',
    rating: 5.0,
    courseName: '《业务赋能》',
    content: '语言生动，内容丰富，案例真实可信，逻辑清晰',
    date: '2023/07/06',
    company: '*****灵北',
    hasReply: false,
    image: '/statics/images/case-1.jpg',
    helpfulCount: 0,
  },
  {
    id: 2,
    username: 'Li****99',
    role: '学员',
    rating: 5.0,
    courseName: '《战略执行力》',
    content: '课程非常实战，拿回去就能用，解决了很多实际管理中的困惑！',
    date: '2023/08/12',
    company: '*****科技',
    hasReply: false,
    helpfulCount: 2,
  },
  {
    id: 3,
    username: 'Wang**88',
    role: '培训经理',
    rating: 4.5,
    courseName: '《组织能力建设》',
    content: '课程把战略目标拆成可执行动作，现场工具可以直接用于月度经营会议，落地性非常强。',
    date: '2026-03-08',
    company: '*****制造',
    hasReply: true,
    replyContent: '感谢认可，后续可安排复盘辅导。',
    helpfulCount: 1,
  },
];

/** 著作 mock */
export const mockBooks: MockBook[] = [
  {
    id: 1,
    title: '数字化增长引擎',
    image: '/statics/images/case-1.jpg',
    publisher: '电子工业出版社',
    price: 0,
  },
  {
    id: 2,
    title: '赋能三板斧—让天下没有难做的培训',
    image: '/statics/images/case-2.jpg',
    publisher: '机械工业出版社',
    price: 79.0,
  },
  {
    id: 3,
    title: '组织增长方法论',
    image: '/statics/images/expert-main.jpg',
    publisher: '中信出版集团',
    price: 59.0,
  },
  {
    id: 4,
    title: '战略执行力实战',
    image: '/statics/images/course-1.jpg',
    publisher: '人民邮电出版社',
    price: 88.0,
  },
];

/** 相关讲师 mock */
export const mockRelatedTrainers: MockRelatedTrainer[] = [
  {
    id: 101,
    name: '李明华',
    title: '数字化转型实战专家',
    avatar: '/statics/images/expert-robert.jpg',
    score: 4.9,
  },
  {
    id: 102,
    name: '张建国',
    title: '战略绩效管理顾问',
    avatar: '/statics/images/expert-liqinghua.jpg',
    score: 4.8,
  },
  {
    id: 103,
    name: '王芳',
    title: '组织发展与人才建设',
    avatar: '/statics/images/expert-chensiyu.jpg',
    score: 5.0,
  },
  {
    id: 104,
    name: '刘伟',
    title: '企业文化建设专家',
    avatar: '/statics/images/expert-main.jpg',
    score: 4.7,
  },
];
