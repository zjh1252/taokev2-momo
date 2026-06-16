import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

async function authHeaders() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

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

  const uploadRes = await fetch(`${BACKEND_URL}/uploads/images`, {
    method: 'POST',
    headers: uploadHeaders,
    body: uploadForm
  });

  const uploadBody = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    return NextResponse.json(
      {
        code: uploadBody.code ?? uploadRes.status,
        message: uploadBody.message || '上传失败'
      },
      { status: uploadRes.status }
    );
  }

  const uploaded = uploadBody.data as {
    url: string;
    originalName?: string;
  };

  const materialType = (formData.get('materialType') as string) || 'COVER';
  const name =
    (formData.get('name') as string) || uploaded.originalName || file.name;
  const category = (formData.get('category') as string) || '其它';
  const scene = (formData.get('scene') as string) || 'GENERAL';
  const enabled = formData.get('enabled') !== 'false';
  const isDefault = formData.get('isDefault') === 'true';

  const createRes = await fetch(`${BACKEND_URL}/admin/materials`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      materialType,
      name,
      url: uploaded.url,
      category,
      scene,
      enabled,
      isDefault
    })
  });

  const createBody = await createRes.json().catch(() => ({}));
  return NextResponse.json(createBody, { status: createRes.status });
}
