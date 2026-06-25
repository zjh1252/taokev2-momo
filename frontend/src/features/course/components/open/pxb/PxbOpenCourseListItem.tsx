'use client';

import { decodeHtmlEntities } from '@/lib/html-entities';
import type { CourseListItem } from '../../../api/types';

function formatDateTime(value?: string): string {
  if (!value) return '待定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '待定';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StarRating({ score }: { score: number }) {
  const filled = Math.round(Math.max(0, Math.min(5, score)));
  return (
    <span className="pxb-stars" aria-label={`评分 ${score}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`pxb-star${i < filled ? ' is-filled' : ''}`}>
          ★
        </span>
      ))}
    </span>
  );
}

interface Props {
  course: CourseListItem;
}

export function PxbOpenCourseListItem({ course }: Props) {
  const title = decodeHtmlEntities(course.title);
  const hours = course.totalHours ? Number(course.totalHours) : 0;
  const price = course.price != null ? Number(course.price) : 0;
  const href = `/opencourse/${course.id}.htm?origin=91pxb`;

  return (
    <div className="pxb-course-item">
      <div className="pxb-course-top">
        <div className="pxb-course-title-wrap">
          <a className="pxb-course-title" href={href} title={title} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </div>
        <div className="pxb-course-meta">
          <span>人气：</span>
          <span className="pxb-hit">{course.viewCount ?? 0}</span>
          <span style={{ marginLeft: 12 }}>课程评分:</span>
          <StarRating score={Number(course.score ?? 0)} />
        </div>
      </div>
      <div className="pxb-course-body">
        <div className="pxb-course-grid">
          <div className="pxb-grid-cell w260">
            开课时间：{formatDateTime(course.nextPlanStartDate)}
            {course.statusLabel ? <span>{course.statusLabel}</span> : null}
          </div>
          <div className="pxb-grid-cell w160">课程时长：{hours || 0}小时</div>
          <div className="pxb-grid-cell w290">课程价格：￥{price}元</div>
          <div className="pxb-grid-cell w260">
            开课地点：{course.nextPlanCity?.trim() || '待定'}
          </div>
          <div className="pxb-grid-cell w160">授课讲师：{course.trainerName || '待定'}</div>
          <div className="pxb-grid-cell w290">课程分类：{course.categoryName || '-'}</div>
        </div>
        <div className="pxb-keywords">关键字：{course.keywords || ''}</div>
      </div>
    </div>
  );
}
