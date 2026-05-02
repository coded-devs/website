# PROMPTS.md

Purpose
- A library of reusable prompts and templates for Codex/GPT models used to generate page copy, component scaffolds, and meta data for the CODEDDEVS website.

Usage
- Copy the most relevant template, replace placeholders, and pass to the model with the required context (existing files, design rules, and example outputs).

Guidelines for prompts
- Always include: target file path, required style rules (Tailwind + design tokens), and whether output is code or copy.
- Prefer short, deterministic instructions with examples.
- Include an "Acceptable output" example block where possible.

Templates

## Create React Component (TypeScript + Tailwind)
Input: name, props (name:type), style (CSS module|tailwind), interactivity (yes/no)
Prompt:
"Create a TypeScript React functional component named <name> with props <props>. Use server components by default; add 'use client' only if `interactivity` is yes. Follow project style rules: Tailwind, no animations, no external UI libs, JetBrains Mono for headings. Include TS types, a minimal CSS module if requested, and a Jest + React Testing Library unit test. Output: the component code only, and a short 2–3 line rationale."

Acceptable output (excerpt):
```tsx
export default function Hero({ title }: { title: string }) {
  return (
    <section className="py-24 max-w-5xl mx-auto px-6">
      <h1 className="text-[56px] font-bold">{title}</h1>
    </section>
  )
}
```

## Page Content — Home Hero (Marketing Copy)
Input: product name, audience, tone
Prompt:
"Write a 40–60 word hero headline and a 20–40 word subtext for the HOME page of CODEDDEVS. Tone: professional, minimal, text-first. Include two CTAs with link targets. Also return a suggested meta title (<=60 chars) and description (<=160 chars)."

Acceptable output (excerpt):
- Headline: "Engineering Software That Works for Africa"
- Subtext: "We build AI-first software products for African markets — from first principles, not adaptations."
- CTA 1: "See Our Work" → /projects
- CTA 2: "Get in Touch" → /contact

## Page Content — Project Card
Input: project name, tagline, status, external_url
Prompt:
"Create a short project card copy for <project name> with tagline and a status badge (status:<status>). Include an external link to <external_url> and a short accessibility-friendly link label."

## SEO Meta Generator
Input: page title, keywords
Prompt:
"Generate a concise meta title (<=60 chars) and meta description (<=160 chars) for a page titled '<page title>' targeting keywords: <keywords>. Keep language clear and avoid brand repetition."

## Blog Post Outline from Title
Input: title, audience
Prompt:
"Produce a short outline (H2 headings + 1-sentence summary each) for a blog post titled '<title>' aimed at <audience>. Return also a 2-sentence excerpt suitable for the blog list view."

## Form Validation Prompt (for API route)
Input: route purpose, expected body shape
Prompt:
"Provide a Zod schema and a short parsing example for an API route that accepts: <fields>. Include error messages suitable for end users."

Versioning
- Add a one-line changelog entry whenever templates change.

Testing
- For each template include a test prompt and the expected keys in the output so automated snapshot tests can validate model responses.
