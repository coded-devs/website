import Image from "next/image";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db, teamMembers } from "@/db";
import { getTeamPhotoUrl } from "@/lib/cloudinary";
import { ArrowRightIcon } from "@/components/ui/icons";

async function getFounders() {
  try {
    return await db
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        role: teamMembers.role,
        photo_url: teamMembers.photo_url,
        order_index: teamMembers.order_index,
      })
      .from(teamMembers)
      .where(eq(teamMembers.is_active, true))
      .orderBy(asc(teamMembers.order_index))
      .limit(3);
  } catch {
    return [];
  }
}

export default async function TeamSection() {
  const members = await getFounders();

  const isDev = process.env.NODE_ENV === "development";

  if (members.length === 0) {
    if (isDev) {
      return (
        <section className="bg-white py-24 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
                The Team
              </h2>
              <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
                The founders behind CodedDevs.
              </p>
            </div>
            <div className="mt-10 rounded-lg bg-[#F4F5F8] p-8 text-center font-sans text-sm text-[#6B7896]">
              No team members yet — add them via the admin dashboard
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  return (
    <section className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
            The Team
          </h2>
          <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
            The founders behind CodedDevs.
          </p>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col gap-4">
              {member.photo_url ? (
                <Image
                  src={getTeamPhotoUrl(member.photo_url)}
                  alt={member.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#D1D6E0] font-sans text-xl font-medium text-[#121F38]">
                  {getInitials(member.name)}
                </div>
              )}
              <div className="space-y-1">
                <h3 className="font-mono text-lg font-semibold text-[#121F38]">
                  {member.name}
                </h3>
                <p className="font-sans text-sm text-[#6B7896]">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link
            href="/team"
            className="inline-flex items-center gap-1.5 font-sans text-base font-medium text-[#121F38] hover:text-[#1A2D4F]"
          >
            <span>Meet the full team</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
