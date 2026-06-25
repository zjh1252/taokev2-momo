/** @deprecated 请使用 PxbCourseListItem */
import type { CourseListItem } from '../../../api/types';
import { PXB_OPEN_COURSE_CONFIG } from './config/pxb-course-list-config';
import { PxbCourseListItem } from './PxbCourseListItem';

interface Props {
  course: CourseListItem;
}

export function PxbOpenCourseListItem({ course }: Props) {
  return <PxbCourseListItem course={course} config={PXB_OPEN_COURSE_CONFIG} />;
}
