import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100vh] flex flex-col items-center justify-center [font-family:system-ui,_-apple-system,_sans-serif] p-[2rem] text-center bg-[color:#f9fafb] text-[color:#111827]">
      <h1 className="text-[length:3rem] [font-weight:800] text-[color:#4f46e5] m-0">
        404
      </h1>
      <h2 className="text-[length:1.5rem] font-semibold mt-[0.5rem] mb-[1rem]">
        Page Not Found
      </h2>
      <p className="text-[color:#6b7280] max-w-[420px] [margin:0_auto_2rem_auto] text-[length:0.95rem]">
        The admin page or resource you are looking for does not exist or has
        been moved.
      </p>
      <Link
        href="/dashboard"
        className="bg-[color:#4f46e5] text-white [padding:0.6rem_1.25rem] rounded-[6px] no-underline font-semibold text-[length:0.9rem]"
      >
        &larr; Return to Dashboard
      </Link>
    </div>
  );
}
