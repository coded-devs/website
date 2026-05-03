const recognitionItems = [
  "🥇 1st Place — Build with AT: Generative AI + APIs Across Africa · Africa's Talking & Google · Feb 2026",
  "🥇 1st Place — Build with AI Programme Finale · Africa's Talking & Google · Kenya, Nigeria & South Africa · 2026",
  "🥉 3rd Place — Build for Hardware Lagos · Africa's Talking · Feb 2026",
];

export default function HackathonStrip() {
  return (
    <section className="bg-[#F4F5F8] py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          <h2 className="font-mono text-2xl font-semibold text-[#121F38]">
            Recognition
          </h2>
          <div className="space-y-4">
            {recognitionItems.map((item) => (
              <p
                key={item}
                className="font-sans text-base leading-[1.7] text-[#2C3A52]"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
