import type { CategoryTreeNode, PageResponse, CourseListItem } from '../../../api/types';
import { PXB_INTERNAL_COURSE_CONFIG } from './config/pxb-course-list-config';
import { PxbCourseListSection } from './PxbCourseListSection';

interface Props {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
}

export function PxbInnerCourseListSection(props: Props) {
  return <PxbCourseListSection config={PXB_INTERNAL_COURSE_CONFIG} {...props} />;
}
