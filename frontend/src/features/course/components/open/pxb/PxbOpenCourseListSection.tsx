import type { CategoryTreeNode, PageResponse, CourseListItem } from '../../../api/types';
import { PXB_OPEN_COURSE_CONFIG } from './config/pxb-course-list-config';
import { PxbCourseListSection } from './PxbCourseListSection';

interface Props {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
}

export function PxbOpenCourseListSection(props: Props) {
  return <PxbCourseListSection config={PXB_OPEN_COURSE_CONFIG} {...props} />;
}
