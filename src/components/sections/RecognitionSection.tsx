import Link from "next/link";
import Badge from "@/components/ui/Badge";
import {
  ArrowRightIcon,
  Medal1Icon,
  Medal2Icon,
  Medal3Icon,
  TrophyIcon,
} from "@/components/ui/icons";

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

export default function RecognitionSection({
  posts,
}: RecognitionSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-24 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-mono text-3xl font-bold leading-[1.2] text-[#121F38] md:text-[40px]">
            Recognition
          </h2>
          <p className="font-sans text-base leading-[1.7] text-[#6B7896]">
            Our hackathon wins and industry achievements.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const placement = getPlacementDisplay(post.placement);
            const PlacementIcon = placement.Icon;

            return (
              <article
                key={post.id}
                className="flex h-full flex-col rounded-lg border border-[#C4CAD6] bg-[#F4F5F8] p-6"
              >
                <div className="flex flex-1 flex-col gap-5">
                  <div className="flex items-center justify-between gap-3">
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
                    <p className="line-clamp-2 font-sans text-sm leading-[1.7] text-[#2C3A52]">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#C4CAD6] pt-5">
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
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
