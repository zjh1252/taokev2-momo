// 课程前端领域模型

export interface Course {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverUrl: string;
  hours: number;
  instructorName: string;
  // TODO: 补充字段
}
