import { getBackendUrl } from '@/lib/backend-url';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { code: 400, message: '缺少文件' },
      { status: 400 }
    );
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { code: 400, message: '请上传 JPG/PNG 格式、大小 ≤2MB 的图片' },
      { status: 400 }
    );
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { code: 400, message: '请上传 JPG/PNG 格式、大小 ≤2MB 的图片' },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const uploadForm = new FormData();
  uploadForm.append('file', file);

  const uploadHeaders: Record<string, string> = {};
  if (accessToken) {
    uploadHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const uploadRes = await fetch(`${getBackendUrl()}/uploads/images`, {
    method: 'POST',
    headers: uploadHeaders,
    body: uploadForm
  });

  const uploadBody = await uploadRes.json().catch(() => ({}));
  return NextResponse.json(uploadBody, { status: uploadRes.status });
}
