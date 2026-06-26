import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from '@/features/materials/material-utils';
import { getBackendUrl } from '@/lib/backend-url';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const IMAGE_UPLOAD_HINT = `请上传 JPG/PNG 格式、大小 ≤${MAX_FILE_SIZE_MB}MB 的图片`;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

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
      { code: 400, message: IMAGE_UPLOAD_HINT },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { code: 400, message: IMAGE_UPLOAD_HINT },
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
