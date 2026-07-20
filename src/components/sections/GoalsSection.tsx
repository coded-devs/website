import {
  BrainCircuit,
  CreditCard,
  ShoppingBag,
  UsersRound,
} from "lucide-react";

const goals = [
  {
    title: "Artificial Intelligence",
    description: "AI products shaped around local workflows and decisions.",
    Icon: BrainCircuit,
    accent: "border-[#3B82F6]/70 bg-[#3B82F6]/10 text-[#93C5FD]",
  },
  {
    title: "Payments",
    description: "Payment systems designed for how African businesses move money.",
    Icon: CreditCard,
    accent: "border-[#C98A3A]/80 bg-[#C98A3A]/10 text-[#F2C078]",
  },
  {
    title: "Commerce",
    description: "Software for selling, discovery, operations, and growth.",
    Icon: ShoppingBag,
    accent: "border-[#A85D3A]/80 bg-[#A85D3A]/15 text-[#E4A083]",
  },
  {
    title: "Community",
    description: "A growing network of designers, developers, and creators.",
    Icon: UsersRound,
    accent: "border-[#2F6F4E]/80 bg-[#2F6F4E]/20 text-[#9BD3B1]",
  },
];

export default function GoalsSection() {
  return (
    <section className="bg-[#121F38] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-8 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 xl:px-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[760px] lg:grid-cols-4">
          {goals.map(({ title, description, Icon, accent }) => (
            <article
              key={title}
              className="group flex items-start gap-3 border-l border-white/15 pl-4"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center border ${accent} group-hover:scale-105`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-semibold leading-snug text-white">
                  {title}
                </h3>
                <p className="mt-1 font-sans text-sm leading-5 text-[#D1D6E0]">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}