import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 公开课报名 Excel 导出 BFF（透传二进制）
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:30
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const qs = request.nextUrl.searchParams.toString();
  const backendUrl = getBackendUrl();

  const res = await fetch(
    `${backendUrl}/admin/open-course-enrollments/export?${qs}`,
    {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      { code: -1, message: text || `导出失败 HTTP ${res.status}` },
      { status: res.status },
    );
  }

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        "attachment; filename*=UTF-8''%E5%85%AC%E5%BC%80%E8%AF%BE%E6%8A%A5%E5%90%8D.xlsx",
    },
  });
}
