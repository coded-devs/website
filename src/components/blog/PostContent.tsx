"use client";

import ImageExtension from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { ALLOWED_LINK_PROTOCOLS, isAllowedLinkHref } from "@/lib/tiptap";
import { cn, slugify } from "@/lib/utils";

export type TiptapJson = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapJson[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
  text?: string;
} & Record<string, unknown>;

type PostContentProps = {
  content: TiptapJson;
  className?: string;
};

const extensions = [
  StarterKit,
  ImageExtension,
  TiptapLink.configure({
    openOnClick: true,
    autolink: false,
    protocols: ALLOWED_LINK_PROTOCOLS,
    isAllowedUri: (url, { defaultValidate }) =>
      defaultValidate(url) && isAllowedLinkHref(url),
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
  }),
];

export default function PostContent({ content, className }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const editor = useEditor(
    {
      extensions,
      content,
      editable: false,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "font-sans text-[18px] leading-[1.75] text-[#2C3A52] outline-none",
        },
      },
    },
    [content],
  );

  useEffect(() => {
    const root = contentRef.current;

    if (!root) {
      return;
    }

    root.querySelectorAll("h2, h3").forEach((heading) => {
      const text = heading.textContent?.trim();

      if (text) {
        heading.id = slugify(text);
      }
    });
  }, [editor]);

  return (
    <div ref={contentRef}>
      <EditorContent
        editor={editor}
        className={cn(
          "max-w-3xl",
          "[&_a]:font-medium [&_a]:text-[#121F38] [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-[#1A2D4F]",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-[#C4CAD6] [&_blockquote]:pl-5 [&_blockquote]:text-[#121F38]",
          "[&_code]:rounded-md [&_code]:bg-[#F4F5F8] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-[#121F38]",
          "[&_h2]:mb-5 [&_h2]:mt-12 [&_h2]:scroll-mt-28 [&_h2]:font-mono [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-[1.2] [&_h2]:text-[#121F38]",
          "[&_h3]:mb-4 [&_h3]:mt-10 [&_h3]:scroll-mt-28 [&_h3]:font-mono [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-[1.3] [&_h3]:text-[#121F38]",
          "[&_hr]:border-[#C4CAD6]",
          "[&_img]:h-auto [&_img]:w-full [&_img]:rounded-lg",
          "[&_li]:pl-1",
          "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-8",
          "[&_p]:my-6",
          "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#121F38] [&_pre]:p-5 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-[1.7] [&_pre]:text-white",
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white",
          "[&_strong]:font-semibold",
          "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-8",
          className,
        )}
      />
    </div>
  );
}
