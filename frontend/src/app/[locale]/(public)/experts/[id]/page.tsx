import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * 旧路由 /experts/:id → 重定向到 /trainers/:id
 */
export default async function ExpertDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/trainers/${id}`);
}
