import {
  BrainCircuitIcon,
  CreditCardIcon,
  NetworkIcon,
  ShoppingBagIcon,
  UsersRoundIcon,
} from "@/components/ui/icons";

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white py-20 md:py-24 lg:py-28">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-full bg-[linear-gradient(180deg,#FFFFFF_0%,#F8F1E8_48%,#FFFFFF_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-28 -z-10 hidden h-72 w-72 rounded-full bg-[#C98A3A]/15 blur-3xl lg:block"
        aria-hidden="true"
      />
      <div
        className="absolute left-0 bottom-16 -z-10 hidden h-64 w-64 rounded-full bg-[#3B82F6]/10 blur-3xl lg:block"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1440px] px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="grid items-center gap-14 lg:min-h-[620px] lg:grid-cols-[minmax(0,760px)_minmax(420px,520px)] lg:justify-between xl:gap-20">
          <div className="max-w-5xl">
            <div className="hero-enter space-y-8">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-[#A85D3A]">
                Nigerian technology company
              </p>
              <h1 className="max-w-4xl font-mono text-[36px] font-bold leading-[1.05] text-[#121F38] sm:text-5xl md:text-[64px] xl:text-[72px]">
                Engineering Software That Works for Africa
              </h1>
              <p className="max-w-2xl font-sans text-lg leading-[1.75] text-[#2C3A52] md:text-xl">
                CodedDevs builds software, payment, and AI products for African
                markets from the ground up - not borrowed systems, not adapted
                assumptions.
              </p>
              <div className="grid max-w-2xl grid-cols-2 gap-3 pt-2 font-sans text-sm text-[#2C3A52] sm:grid-cols-4">
                {[
                  "AI products",
                  "Payment systems",
                  "Digital commerce",
                  "Builder community",
                ].map((item) => (
                  <span
                    key={item}
                    className="border-l-2 border-[#C98A3A] bg-white/70 px-3 py-2 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-visual-enter relative mx-auto w-full max-w-[520px] lg:mx-0">
            <div className="relative overflow-hidden border border-[#C4CAD6] bg-[#121F38] p-4 shadow-2xl shadow-[#121F38]/20">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(201,138,58,0.25),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(59,130,246,0.2),transparent_34%),radial-gradient(circle_at_70%_78%,rgba(47,111,78,0.26),transparent_32%)]"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 opacity-25 [background-image:linear-gradient(#D1D6E0_1px,transparent_1px),linear-gradient(90deg,#D1D6E0_1px,transparent_1px)] [background-size:34px_34px]"
                aria-hidden="true"
              />

              <div className="relative border border-white/15 bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D1D6E0]">
                      African market systems
                    </p>
                    <p className="mt-1 font-mono text-base font-semibold text-white">
                      Built around how things work here
                    </p>
                  </div>
                  <NetworkIcon className="h-5 w-5 text-[#C98A3A]" aria-hidden="true" />
                </div>

                <div className="relative aspect-[1.08] overflow-hidden border border-white/10 bg-[#F4F5F8]">
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 520 480"
                    role="img"
                    aria-label="Abstract African technology network connecting AI, payments, commerce, and community systems."
                  >
                    <path
                      d="M240 46 302 70 338 116 352 164 394 205 374 256 406 300 360 342 318 348 294 408 244 438 206 404 178 350 138 328 118 278 82 240 106 190 92 144 136 96 190 74Z"
                      fill="#FFFFFF"
                      opacity="0.92"
                    />
                    <path
                      d="M240 46 302 70 338 116 352 164 394 205 374 256 406 300 360 342 318 348 294 408 244 438 206 404 178 350 138 328 118 278 82 240 106 190 92 144 136 96 190 74Z"
                      fill="none"
                      stroke="#121F38"
                      strokeWidth="3"
                    />
                    <path
                      className="hero-route"
                      d="M156 226 230 164 312 196 346 278 268 326 188 292 156 226Z"
                      fill="none"
                      stroke="#121F38"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />
                    <path
                      className="hero-route hero-route-delay"
                      d="M230 164 268 326 346 278"
                      fill="none"
                      stroke="#A85D3A"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />
                    {[
                      { x: 230, y: 164, color: "#3B82F6" },
                      { x: 156, y: 226, color: "#C98A3A" },
                      { x: 346, y: 278, color: "#A85D3A" },
                      { x: 268, y: 326, color: "#2F6F4E" },
                    ].map((hub) => (
                      <g key={`${hub.x}-${hub.y}`}>
                        <circle
                          className="hero-node"
                          cx={hub.x}
                          cy={hub.y}
                          r="18"
                          fill={hub.color}
                          opacity="0.18"
                        />
                        <circle cx={hub.x} cy={hub.y} r="9" fill={hub.color} />
                      </g>
                    ))}
                  </svg>

                  <div className="absolute left-4 top-4 w-44 border border-[#C4CAD6] bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-[#3B82F6]">
                      <BrainCircuitIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em]">
                        AI products
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full bg-[#D1D6E0]" />
                    <div className="mt-2 h-2 w-2/3 bg-[#3B82F6]" />
                  </div>

                  <div className="absolute right-4 top-20 w-40 border border-[#C4CAD6] bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-[#C98A3A]">
                      <CreditCardIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em]">
                        Payments
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-lg font-semibold text-[#121F38]">
                      Local rails
                    </p>
                  </div>

                  <div className="absolute bottom-4 left-6 w-40 border border-[#C4CAD6] bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-[#A85D3A]">
                      <ShoppingBagIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em]">
                        Commerce
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <span key={index} className="h-4 bg-[#F4F5F8]" />
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-12 right-8 w-44 border border-[#C4CAD6] bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-[#2F6F4E]">
                      <UsersRoundIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em]">
                        Community
                      </span>
                    </div>
                    <div className="mt-3 flex -space-x-2">
                      {["#121F38", "#C98A3A", "#2F6F4E", "#3B82F6"].map(
                        (color) => (
                          <span
                            key={color}
                            className="h-7 w-7 rounded-full border-2 border-white"
                            style={{ backgroundColor: color }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}