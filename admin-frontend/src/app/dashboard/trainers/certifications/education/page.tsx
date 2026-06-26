import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/dashboard/trainers/certifications?certTab=education');
}
