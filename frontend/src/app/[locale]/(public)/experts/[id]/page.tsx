import { permanentRedirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * 旧路由 /experts/:id → 永久重定向到 /trainer/:id.htm
 */
export default async function ExpertDetailRedirect({ params }: Props) {
  const { id } = await params;
  permanentRedirect(`/trainer/${id}.htm`);
}
