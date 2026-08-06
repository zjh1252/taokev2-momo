import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ImageCropperUploader } from './index';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    unoptimized?: boolean;
  }) => {
    const { src, alt, fill, unoptimized, ...imgProps } = props;
    void fill;
    void unoptimized;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={String(src)} alt={alt ?? ''} {...imgProps} />
    );
  },
}));

vi.mock('react-easy-crop', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    children,
  }: {
    open?: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

describe('ImageCropperUploader', () => {
  it('renders uploaded remote preview with no-referrer for CDN hotlink protection', () => {
    const markup = renderToStaticMarkup(
      <ImageCropperUploader
        value="https://cdn5-pxb-videos.taoke.com/taoke/upload/images/202608/cover.jpg"
        onChange={() => {}}
      />,
    );

    expect(markup).toContain(
      'src="https://cdn5-pxb-videos.taoke.com/taoke/upload/images/202608/cover.jpg"',
    );
    expect(markup).toMatch(/referrerpolicy="no-referrer"/i);
  });
});
