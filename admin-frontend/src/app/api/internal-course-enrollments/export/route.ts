import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/backend-url';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 内训课报名 Excel 导出 BFF（透传二进制）
 *
 * @author Fangxinxin
 * @date 2026-08-07 10:15
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const qs = request.nextUrl.searchParams.toString();
  const backendUrl = getBackendUrl();

  const res = await fetch(
    `${backendUrl}/admin/internal-course-enrollments/export?${qs}`,
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
        "attachment; filename*=UTF-8''%E5%86%85%E8%AE%AD%E8%AF%BE%E6%8A%A5%E5%90%8D.xlsx",
    },
  });
}
