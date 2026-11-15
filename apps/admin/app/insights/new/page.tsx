import { redirect } from 'next/navigation';

export default function ImageOnlyRedirect() {
  redirect('/images');
}
