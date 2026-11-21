'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/context/auth-context';

export default function AdminHome() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  return (
    <main className="p-[2rem] text-center [font-family:sans-serif]">
      <p role="status">Directing to CodedDevs Admin...</p>
    </main>
  );
}
