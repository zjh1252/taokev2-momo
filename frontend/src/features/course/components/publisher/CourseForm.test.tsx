import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CourseForm from './CourseForm';

vi.mock('@/components/rich-text-editor', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

vi.mock('@/components/region-cascader', () => ({
  default: () => <div data-testid="region-cascader" />,
}));

vi.mock('@/components/image-cropper-uploader', () => ({
  ImageCropperUploader: () => <div data-testid="image-cropper-uploader" />,
}));

vi.mock('@/features/ops-material/components/MaterialPickerButton', () => ({
  MaterialPickerButton: () => <button type="button">从素材库选择</button>,
}));

vi.mock('@/features/course/api/service', () => ({
  getCourseCategoryTree: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/features/course/api/publisher-service', () => ({
  parseCourseMaterial: vi.fn(),
}));

describe('CourseForm', () => {
  it('labels course duration fields as days and total hours without implying conversion', () => {
    const markup = renderToStaticMarkup(<CourseForm onSubmit={async () => {}} />);

    expect(markup).toContain('培训天数');
    expect(markup).toContain('总学时');
    expect(markup).not.toContain('等于');
  });
});
