import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRightIcon, AwardIcon } from "@/components/ui/icons";
import { formatDate, toDateTimeAttribute } from "@/lib/date";
import { cn } from "@/lib/utils";

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

/** `placement` is plain text in the schema — the 1st/2nd/3rd/winner values are
 *  a UI convention, so anything unrecognised still gets a sensible label. */
function placementLabel(placement: string | null) {
  switch (placement) {
    case "1st":
      return "1st Place";
    case "2nd":
      return "2nd Place";
    case "3rd":
      return "3rd Place";
    case "winner":
      return "Winner";
    default:
      return "Achievement";
  }
}

function isTopPlacement(placement: string | null) {
  return placement === "1st" || placement === "winner";
}

export default function RecognitionSection({ posts }: RecognitionSectionProps) {
  const isDev = process.env.NODE_ENV === "development";

  if (posts.length === 0) {
    if (isDev) {
      return (
        <section className="band band--mist">
          <div className="rail">
            <div className="sectionhead">
              <div>
                <p className="eyebrow">Recognition</p>
                <h2 className="h2">Where our work has been recognised</h2>
              </div>
            </div>
            <div className="rounded-lg bg-white p-8 text-center font-sans text-sm text-[#626F8B]">
              No recognition posts yet — publish a blog post with
              show_in_recognition enabled.
            </div>
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <section className="band band--mist" aria-labelledby="rec-h2">
      <div className="rail">
        <div className="rec-split">
          <Reveal className="rec-split__head">
            <p className="eyebrow">Recognition</p>
            <h2 className="h2" id="rec-h2">
              Where our work has been recognised
            </h2>
            <Link className="link" href="/blog">
              Read all stories
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </Reveal>

          <Reveal stagger className="rec">
            {posts.map((post) => (
              <article className="rec__item" key={post.id}>
                <div className="rec__place">
                  <AwardIcon
                    className={cn(
                      "rec__medal",
                      isTopPlacement(post.placement) && "rec__medal--gold",
                    )}
                  />
                  <span>{placementLabel(post.placement)}</span>
                </div>
                <h3 className="rec__title">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="rec__excerpt">{post.excerpt}</p>
                <time
                  className="rec__date"
                  dateTime={toDateTimeAttribute(post.published_at)}
                >
                  {formatDate(post.published_at)}
                </time>
              </article>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
