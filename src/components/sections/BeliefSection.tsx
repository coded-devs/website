import Reveal from "@/components/ui/Reveal";

const columns = [
  {
    title: "Built from first principles",
    body: "Every product starts with the constraints of the market it serves, not with a template lifted from another one.",
  },
  {
    title: "Product-driven, not project-driven",
    body: "We are not an agency. We build, own, and operate our own products — and we keep shipping after launch.",
  },
  {
    title: "Three founders, one growing team",
    body: "Kareem Aliameen, Yusuf Saheed, and Amoo Mustakheem, supported by a growing team of designers, developers, and creators.",
  },
];

/**
 * The statement band. Renders unconditionally — it carries no database content,
 * so an empty database still yields a page with a point of view.
 */
export default function BeliefSection() {
  return (
    <section className="band band--roomy band--navy" aria-labelledby="belief-h2">
      <div className="rail">
        <Reveal stagger>
          <p className="eyebrow eyebrow--onNavy">Why we exist</p>

          <h2 className="belief__quote" id="belief-h2">
            The African market deserves technology built <em>for</em> it — not
            borrowed, not adapted.
          </h2>

          <p className="belief__body">
            Most software reaching this continent was designed somewhere else,
            for someone else, and shipped here with the labels changed. It
            assumes infrastructure that isn&rsquo;t here, payment rails that
            don&rsquo;t apply, and users who behave nothing like ours. CodedDevs
            starts from the opposite end: we build from the market outward, and
            we ship products people here actually use.
          </p>
        </Reveal>

        <Reveal stagger className="belief__cols">
          {columns.map((column) => (
            <div className="belief__col" key={column.title}>
              <h3>{column.title}</h3>
              <p>{column.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
