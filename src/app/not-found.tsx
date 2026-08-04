import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-24">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <Image
          src="/mascot/kodysmile.svg"
          alt="Kody, the CodedDevs mascot"
          width={200}
          height={200}
          className="h-[200px] w-auto"
          priority
        />

        <p className="mt-10 font-mono text-7xl font-bold leading-none text-[#121F38] md:text-8xl">
          404
        </p>

        <h1 className="mt-6 font-mono text-3xl font-semibold leading-[1.3] text-[#121F38]">
          Page not found
        </h1>

        <p className="mt-4 font-sans text-base leading-[1.7] text-[#2C3A52]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <Button asChild className="mt-8">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
