"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUpload from "@/components/admin/media/ImageUpload";
import RichTextEditor, {
  type TiptapJson,
} from "@/components/admin/editors/RichTextEditor";
import { cn, countWords, slugify, TEAM_BIO_MAX_WORDS } from "@/lib/utils";

type FormMode = "create" | "edit";
type StatusMessage = string | null;

type TeamFormValues = {
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  order_index: number;
  is_active: boolean;
};

type ProductFormValues = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  cover_url: string;
  external_url: string;
  github_url: string;
  status: "development" | "live" | "archived";
  is_featured: boolean;
  order_index: number;
};

type BlogFormValues = {
  title: string;
  slug: string;
  category: "Product Update" | "Announcement" | "Roadmap" | "Story";
  excerpt: string;
  content: TiptapJson;
  cover_url: string;
  author: string;
  is_published: boolean;
  showInRecognition: boolean;
  placement: "1st" | "2nd" | "3rd" | "winner" | "";
};


type TeamFormProps = {
  mode: FormMode;
  initialValues?: Partial<TeamFormValues>;
  endpoint: string;
};

type ProductFormProps = {
  mode: FormMode;
  initialValues?: Partial<ProductFormValues>;
  endpoint: string;
};

type BlogFormProps = {
  mode: FormMode;
  initialValues?: Partial<BlogFormValues>;
  endpoint: string;
};


const emptyDocument: TiptapJson = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

// The admin API returns Zod's flattened issues under `details.fieldErrors`,
// shaped like { linkedin_url: ["Invalid URL"] }. Pull those out so the form can
// name the field that failed instead of showing a bare "Invalid input".
function getFieldErrorMessage(value: unknown) {
  if (typeof value !== "object" || value === null || !("details" in value)) {
    return null;
  }

  const { details } = value as { details: unknown };

  if (
    typeof details !== "object" ||
    details === null ||
    !("fieldErrors" in details)
  ) {
    return null;
  }

  const { fieldErrors } = details as { fieldErrors: unknown };

  if (typeof fieldErrors !== "object" || fieldErrors === null) {
    return null;
  }

  const messages = Object.entries(fieldErrors as Record<string, unknown>)
    .map(([field, issues]) =>
      Array.isArray(issues) && issues.length > 0
        ? `${field}: ${issues.join(", ")}`
        : null,
    )
    .filter((entry): entry is string => entry !== null);

  return messages.length > 0 ? messages.join(" — ") : null;
}

function getErrorMessage(value: unknown) {
  const fieldErrors = getFieldErrorMessage(value);

  if (fieldErrors) {
    return fieldErrors;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return "Something went wrong.";
}

function optionalUrl(value: string) {
  return value.trim() || null;
}

async function submitJson(endpoint: string, mode: FormMode, payload: unknown) {
  const response = await fetch(endpoint, {
    method: mode === "create" ? "POST" : "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result));
  }
}

function FormActions({
  mode,
  isSubmitting,
}: {
  mode: FormMode;
  isSubmitting: boolean;
}) {
  return (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting
        ? "Saving..."
        : mode === "create"
          ? "Create"
          : "Save Changes"}
    </Button>
  );
}

export function TeamMemberForm({
  mode,
  initialValues,
  endpoint,
}: TeamFormProps) {
  const router = useRouter();
  const [error, setError] = useState<StatusMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<TeamFormValues>({
    name: initialValues?.name ?? "",
    role: initialValues?.role ?? "",
    bio: initialValues?.bio ?? "",
    photo_url: initialValues?.photo_url ?? "",
    linkedin_url: initialValues?.linkedin_url ?? "",
    github_url: initialValues?.github_url ?? "",
    twitter_url: initialValues?.twitter_url ?? "",
    order_index: initialValues?.order_index ?? 0,
    is_active: initialValues?.is_active ?? true,
  });
  const bioWordCount = countWords(values.bio);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Stop here rather than letting the server reject it: nothing is lost by
    // catching it locally, and the writer keeps everything they typed.
    if (bioWordCount > TEAM_BIO_MAX_WORDS) {
      setError(
        `Bio is ${bioWordCount} words. Please shorten it to ${TEAM_BIO_MAX_WORDS} or fewer.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitJson(endpoint, mode, {
        name: values.name,
        role: values.role,
        bio: values.bio,
        photo_url: optionalUrl(values.photo_url),
        linkedin_url: optionalUrl(values.linkedin_url),
        github_url: optionalUrl(values.github_url),
        twitter_url: optionalUrl(values.twitter_url),
        order_index: Number(values.order_index),
        is_active: values.is_active,
      });
      router.push("/admin/team");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 rounded-lg border border-[#C4CAD6] bg-white p-6">
      <Input label="Name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required />
      <Input label="Role" value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value })} required />
      <div className="space-y-1">
        <Textarea label="Bio" value={values.bio} onChange={(event) => setValues({ ...values, bio: event.target.value })} required />
        <p className={cn("text-right font-sans text-xs", bioWordCount > TEAM_BIO_MAX_WORDS ? "text-[#DC2626]" : "text-[#6B7896]")}>
          {bioWordCount} / {TEAM_BIO_MAX_WORDS} words
        </p>
      </div>
      <ImageUpload folder="team" aspectRatio={1} value={values.photo_url || null} onChange={(url) => setValues({ ...values, photo_url: url })} />
      <div className="grid gap-4 md:grid-cols-3">
        <Input label="LinkedIn URL" value={values.linkedin_url} onChange={(event) => setValues({ ...values, linkedin_url: event.target.value })} />
        <Input label="GitHub URL" value={values.github_url} onChange={(event) => setValues({ ...values, github_url: event.target.value })} />
        <Input label="X URL" value={values.twitter_url} onChange={(event) => setValues({ ...values, twitter_url: event.target.value })} />
      </div>
      <Input label="Order Index" type="number" value={values.order_index} onChange={(event) => setValues({ ...values, order_index: Number(event.target.value) })} />
      <label className="flex items-center gap-2 font-sans text-sm text-[#121F38]">
        <input type="checkbox" checked={values.is_active} onChange={(event) => setValues({ ...values, is_active: event.target.checked })} />
        Active
      </label>
      {error ? <p className="font-sans text-sm text-[#DC2626]">{error}</p> : null}
      <FormActions mode={mode} isSubmitting={isSubmitting} />
    </form>
  );
}

export function ProductForm({ mode, initialValues, endpoint }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<StatusMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name ?? "",
    slug: initialValues?.slug ?? "",
    tagline: initialValues?.tagline ?? "",
    description: initialValues?.description ?? "",
    cover_url: initialValues?.cover_url ?? "",
    external_url: initialValues?.external_url ?? "",
    github_url: initialValues?.github_url ?? "",
    status: initialValues?.status ?? "development",
    is_featured: initialValues?.is_featured ?? false,
    order_index: initialValues?.order_index ?? 0,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await submitJson(endpoint, mode, {
        ...values,
        cover_url: optionalUrl(values.cover_url),
        external_url: optionalUrl(values.external_url),
        github_url: optionalUrl(values.github_url),
        order_index: Number(values.order_index),
      });
      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 rounded-lg border border-[#C4CAD6] bg-white p-6">
      <Input label="Name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required />
      <Input label="Slug" value={values.slug} onChange={(event) => setValues({ ...values, slug: event.target.value })} required />
      <Input label="Tagline" value={values.tagline} onChange={(event) => setValues({ ...values, tagline: event.target.value })} required />
      <Textarea label="Description" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} required />
      <ImageUpload folder="products" aspectRatio={1200 / 630} value={values.cover_url || null} onChange={(url) => setValues({ ...values, cover_url: url })} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="External URL" value={values.external_url} onChange={(event) => setValues({ ...values, external_url: event.target.value })} />
        <Input label="GitHub URL" value={values.github_url} onChange={(event) => setValues({ ...values, github_url: event.target.value })} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block font-sans text-sm font-medium text-[#121F38]">
          <span className="mb-2 block">Status</span>
          <select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value as ProductFormValues["status"] })} className="w-full rounded-md border border-[#C4CAD6] bg-white px-4 py-3 text-sm">
            <option value="development">Development</option>
            <option value="live">Live</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <Input label="Order Index" type="number" value={values.order_index} onChange={(event) => setValues({ ...values, order_index: Number(event.target.value) })} />
      </div>
      <label className="flex items-center gap-2 font-sans text-sm text-[#121F38]">
        <input type="checkbox" checked={values.is_featured} onChange={(event) => setValues({ ...values, is_featured: event.target.checked })} />
        Featured
      </label>
      {error ? <p className="font-sans text-sm text-[#DC2626]">{error}</p> : null}
      <FormActions mode={mode} isSubmitting={isSubmitting} />
    </form>
  );
}

export function BlogPostForm({ mode, initialValues, endpoint }: BlogFormProps) {
  const router = useRouter();
  const [error, setError] = useState<StatusMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [values, setValues] = useState<BlogFormValues>({
    title: initialValues?.title ?? "",
    slug: initialValues?.slug ?? "",
    category: initialValues?.category ?? "Announcement",
    excerpt: initialValues?.excerpt ?? "",
    content: initialValues?.content ?? emptyDocument,
    cover_url: initialValues?.cover_url ?? "",
    author: initialValues?.author ?? "CODEDDEVS",
    is_published: initialValues?.is_published ?? false,
    showInRecognition: initialValues?.showInRecognition ?? false,
    placement: initialValues?.placement ?? "",
  });

  const computedSlug = useMemo(() => slugify(values.title), [values.title]);
  const activeSlug = slugTouched ? values.slug : computedSlug;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await submitJson(endpoint, mode, {
        title: values.title,
        slug: activeSlug,
        category: values.category,
        excerpt: values.excerpt,
        content: values.content,
        cover_url: optionalUrl(values.cover_url),
        author: values.author,
        is_published: values.is_published,
        showInRecognition: values.showInRecognition,
        placement: values.showInRecognition ? optionalUrl(values.placement) : null,
        ...(mode === "create" && values.is_published
          ? { published_at: new Date().toISOString() }
          : {}),
      });
      router.push("/admin/blog");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-5 rounded-lg border border-[#C4CAD6] bg-white p-6">
      <Input label="Title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} required />
      <Input label="Slug" value={activeSlug} onChange={(event) => { setSlugTouched(true); setValues({ ...values, slug: event.target.value }); }} required />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block font-sans text-sm font-medium text-[#121F38]">
          <span className="mb-2 block">Category</span>
          <select value={values.category} onChange={(event) => setValues({ ...values, category: event.target.value as BlogFormValues["category"] })} className="w-full rounded-md border border-[#C4CAD6] bg-white px-4 py-3 text-sm">
            <option value="Product Update">Product Update</option>
            <option value="Announcement">Announcement</option>
            <option value="Roadmap">Roadmap</option>
            <option value="Story">Story</option>
          </select>
        </label>
        <Input label="Author" value={values.author} onChange={(event) => setValues({ ...values, author: event.target.value })} required />
      </div>
      <Textarea label="Excerpt" value={values.excerpt} onChange={(event) => setValues({ ...values, excerpt: event.target.value })} required />
      <ImageUpload folder="blogs" aspectRatio={1200 / 630} value={values.cover_url || null} onChange={(url) => setValues({ ...values, cover_url: url })} />
      <RichTextEditor content={values.content} onChange={(content) => setValues({ ...values, content })} />
      <label className="flex items-center gap-2 font-sans text-sm text-[#121F38]">
        <input type="checkbox" checked={values.is_published} onChange={(event) => setValues({ ...values, is_published: event.target.checked })} />
        Published
      </label>
      <div className="flex gap-3 rounded-lg border border-[#C4CAD6] bg-[#F4F5F8] p-4 font-sans text-sm text-[#121F38]">
        <input
          id="show-in-recognition"
          type="checkbox"
          checked={values.showInRecognition}
          aria-describedby="show-in-recognition-description"
          onChange={(event) =>
            setValues({
              ...values,
              showInRecognition: event.target.checked,
              placement: event.target.checked ? values.placement : "",
            })
          }
          className="mt-1"
        />
        <span>
          <label htmlFor="show-in-recognition" className="block font-medium">
            Show in Recognition section
          </label>
          <span id="show-in-recognition-description" className="mt-1 block text-[#6B7896]">
            Enable this to feature this post in the Recognition section on the
            home page. Use for hackathon wins and significant achievements only.
          </span>
        </span>
      </div>
      {values.showInRecognition ? (
        <label className="block font-sans text-sm font-medium text-[#121F38]">
          <span className="mb-2 block">Placement (for Recognition section)</span>
          <select
            value={values.placement}
            onChange={(event) =>
              setValues({
                ...values,
                placement: event.target.value as BlogFormValues["placement"],
              })
            }
            className="w-full rounded-md border border-[#C4CAD6] bg-white px-4 py-3 text-sm"
          >
            <option value="">-- None selected --</option>
            <option value="1st">1st Place</option>
            <option value="2nd">2nd Place</option>
            <option value="3rd">3rd Place</option>
            <option value="winner">Winner</option>
          </select>
        </label>
      ) : null}
      {error ? <p className="font-sans text-sm text-[#DC2626]">{error}</p> : null}
      <FormActions mode={mode} isSubmitting={isSubmitting} />
    </form>
  );
}

