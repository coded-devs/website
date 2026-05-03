import ContactForm from "@/components/contact/ContactForm";

const socialLinks = [
  {
    label: "GitHub",
    text: "github.com/coded-devs",
    href: "https://github.com/coded-devs",
  },
  {
    label: "X",
    text: "@CodedDevs",
    href: "https://x.com/CodedDevs",
  },
  {
    label: "TikTok",
    text: "@CodedDevs",
    href: "https://www.tiktok.com/@CodedDevs",
  },
  {
    label: "YouTube",
    text: "@CodedDevs",
    href: "https://www.youtube.com/@CodedDevs",
  },
  {
    label: "Instagram",
    text: "@codeddevs_",
    href: "https://www.instagram.com/codeddevs_",
  },
];

export default function ContactPage() {
  return (
    <main className="bg-white">
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-mono text-4xl font-bold leading-[1.1] text-[#121F38] md:text-[56px]">
              Get in Touch
            </h1>
            <p className="font-sans text-lg leading-[1.75] text-[#2C3A52]">
              Whether you want to partner, invest, or just say hello &mdash;
              we&apos;d love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-10">
            <div className="space-y-3">
              <p className="font-sans text-xs font-medium uppercase tracking-normal text-[#6B7896]">
                Email
              </p>
              <a
                href="mailto:codeddevs.team@gmail.com"
                className="font-sans text-base leading-[1.7] text-[#121F38] hover:text-[#1A2D4F]"
              >
                codeddevs.team@gmail.com
              </a>
            </div>

            <div className="space-y-3">
              <p className="font-sans text-xs font-medium uppercase tracking-normal text-[#6B7896]">
                Location
              </p>
              <p className="font-sans text-base leading-[1.7] text-[#2C3A52]">
                Lagos, Nigeria
              </p>
            </div>

            <div className="space-y-4">
              <p className="font-sans text-xs font-medium uppercase tracking-normal text-[#6B7896]">
                Social
              </p>
              <div className="space-y-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid gap-1 font-sans hover:text-[#1A2D4F]"
                  >
                    <span className="text-sm font-medium text-[#121F38]">
                      {link.label}
                    </span>
                    <span className="text-sm leading-[1.6] text-[#6B7896]">
                      {link.text}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
}
