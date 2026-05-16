import Link from "next/link";
import Badge from "@/components/ui/Badge";
import {
  ArrowRightIcon,
  Medal1Icon,
  Medal2Icon,
  Medal3Icon,
  TrophyIcon,
} from "@/components/ui/icons";
import Card from "@/components/ui/Card";

type RecognitionPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: "Product Update" | "Announcement" | "Roadmap" | "Story";
  placement: string | null;
  published_at: Date | null;
};

type RecognitionSectionProps = {
  posts: RecognitionPost[];
};

function getPlacementDisplay(placement: string | null) {
  switch (placement) {
    case "1st":
      return { Icon: Medal1Icon, label: "1st Place", className: "text-amber-500" };
    case "2nd":
      return { Icon: Medal2Icon, label: "2nd Place", className: "text-slate-500" };
    case "3rd":
      return { Icon: Medal3Icon, label: "3rd Place", className: "text-orange-700" };
    case "winner":
      return { Icon: TrophyIcon, label: "Winner", className: "text-[#121F38]" };
    default:
      return { Icon: TrophyIcon, label: "Achievement", className: "text-[#121F38]" };
  }
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function RecognitionIllustration() {
  return (
    <div className="relative isolate overflow-hidden rounded-[32px] border border-[#D1D6E0] bg-[#F4F5F8] p-8 sm:p-10">
      <div className="absolute left-7 top-8 h-3 w-3 rounded-full bg-[#121F38]/10" />
      <div className="absolute right-8 bottom-7 h-2 w-12 rounded-full bg-[#121F38]/10" />
      <div className="relative grid h-[340px] gap-4">
        <div className="rounded-[32px] border border-[#D1D6E0] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D1D6E0] bg-[#F4F5F8]">
              <span className="h-3 w-3 rounded-full bg-[#121F38]/50" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-[#D1E0E9]" />
              <div className="h-3 w-14 rounded-full bg-[#E1E6EC]" />
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="h-3 w-28 rounded-full bg-[#E9EDF3]" />
            <div className="h-3 w-16 rounded-full bg-[#E9EDF3]" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_0.38fr]">
          <div className="rounded-[28px] border border-[#D1D6E0] bg-[#E9EDF3] p-5">
            <div className="h-3 w-20 rounded-full bg-[#D1E0E9]" />
            <div className="mt-4 h-3 w-16 rounded-full bg-[#E1E6EC]" />
          </div>
          <div className="rounded-[28px] border border-[#D1D6E0] bg-white p-4">
            <div className="h-12 w-full rounded-[24px] bg-[#D1E0E9]" />
          </div>
        </div>

        <div className="rounded-[32px] border border-[#D1D6E0] bg-white/90 p-5">
          <div className="h-3 w-20 rounded-full bg-[#D1E0E9]" />
          <div className="mt-5 grid gap-3">
            <div className="h-3 w-16 rounded-full bg-[#E1E6EC]" />
            <div className="h-3 w-28 rounded-full bg-[#E9EDF3]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecognitionSection({
  posts,
}: RecognitionSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (posts.length === 0) {
    if (isDev) {
      return (
        <section className="bg-white py-24 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <RecognitionIllustration />

              <div className="space-y-6">
                <div className="max-w-2xl space-y-4">
                  <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
                    Recognition
                  </h2>
                  <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
                    Our hackathon wins and industry achievements.
                  </p>
                </div>
                <div className="rounded-[32px] border border-[#D1D6E0] bg-[#F4F5F8] p-8 text-sm text-[#6B7896]">
                  No recognition posts yet
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <RecognitionIllustration />

          <div className="space-y-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
                Recognition
              </h2>
              <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
                Our hackathon wins and industry achievements.
              </p>
            </div>

            <Card className="rounded-[32px] border-[#D1D6E0] bg-[#F4F5F8] p-6 shadow-none">
              <div className="space-y-5">
                {posts.map((post) => {
                  const placement = getPlacementDisplay(post.placement);
                  const PlacementIcon = placement.Icon;

                  return (
                    <article
                      key={post.id}
                      className="rounded-[28px] border border-[#D1D6E0] bg-white p-6"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <p className="flex items-center gap-2 font-sans text-sm font-medium text-[#121F38]">
                            <PlacementIcon className={`h-5 w-5 ${placement.className}`} />
                            {placement.label}
                          </p>
                          <Badge>{post.category}</Badge>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-mono text-xl font-bold leading-[1.35] text-[#121F38]">
                            {post.title}
                          </h3>
                          <p className="font-sans text-sm leading-[1.7] text-[#2C3A52]">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-[#C4CAD6] pt-5">
                          <p className="font-sans text-sm text-[#6B7896]">
                            {formatDate(post.published_at)}
                          </p>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-[#121F38] hover:text-[#1A2D4F]"
                          >
                            <span>Read the story</span>
                            <ArrowRightIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
