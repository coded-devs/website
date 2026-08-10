import Reveal from "@/components/ui/Reveal";

const domains = [
  {
    num: "01",
    name: "Software",
    dot: "domain__dot--software",
    body: "Products designed around how work actually happens here — patchy connectivity, shared devices, and users who arrived on mobile first and stayed there.",
  },
  {
    num: "02",
    name: "Payments",
    dot: "domain__dot--payments",
    body: "Commerce and money movement built on the rails this continent runs on, not the ones a foreign checkout page assumes exist.",
  },
  {
    num: "03",
    name: "Applied AI",
    dot: "domain__dot--ai",
    body: "AI applied to real local problems — language, informal commerce, and the long tail of businesses that never had software written for them.",
  },
];

export default function FocusAreasSection() {
  return (
    <section className="band" aria-labelledby="domains-h2">
      <div className="rail">
        <Reveal className="sectionhead">
          <div>
            <p className="eyebrow">Focus areas</p>
            <h2 className="h2" id="domains-h2">
              Three problems worth solving
            </h2>
          </div>
          <p className="sectionhead__desc">
            Our work concentrates where African markets are underserved and the
            infrastructure is still being written.
          </p>
        </Reveal>

        <Reveal stagger className="domains">
          {domains.map((domain) => (
            <div className="domain" key={domain.num}>
              <p className="domain__num">{domain.num}</p>
              <div className="domain__name">
                <span className={`domain__dot ${domain.dot}`} aria-hidden="true" />
                <h3>{domain.name}</h3>
              </div>
              <p className="domain__desc">{domain.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
