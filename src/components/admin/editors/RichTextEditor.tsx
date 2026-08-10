"use client";

import ImageExtension from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageUpload from "@/components/admin/media/ImageUpload";
import Button from "@/components/ui/Button";
import { ALLOWED_LINK_PROTOCOLS, isAllowedLinkHref } from "@/lib/tiptap";
import { cn } from "@/lib/utils";

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

type RichTextEditorProps = {
  content: TiptapJson | null;
  onChange: (content: TiptapJson) => void;
  readOnly?: boolean;
};

const emptyDocument: TiptapJson = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const extensions = [
  StarterKit,
  ImageExtension,
  TiptapLink.configure({
    openOnClick: false,
    autolink: true,
    protocols: ALLOWED_LINK_PROTOCOLS,
    isAllowedUri: (url, { defaultValidate }) =>
      defaultValidate(url) && isAllowedLinkHref(url),
    shouldAutoLink: isAllowedLinkHref,
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
  }),
];

export default function RichTextEditor({
  content,
  onChange,
  readOnly = false,
}: RichTextEditorProps) {
  const editor = useEditor(
    {
      extensions,
      content: content ?? emptyDocument,
      editable: !readOnly,
      immediatelyRender: false,
      onUpdate: ({ editor: activeEditor }) => {
        onChange(activeEditor.getJSON() as TiptapJson);
      },
      editorProps: {
        attributes: {
          class:
            "min-h-[260px] rounded-b-lg bg-white p-4 font-sans text-base leading-[1.7] text-[#2C3A52] outline-none",
        },
      },
    },
    [readOnly],
  );

  function insertImage(url: string) {
    if (!editor || !url) {
      return;
    }

    editor.chain().focus().setImage({ src: url }).run();
  }

  function setLink() {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", typeof previousUrl === "string" ? previousUrl : "");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#C4CAD6] bg-white">
      {!readOnly ? (
        <div className="flex flex-wrap gap-2 border-b border-[#C4CAD6] bg-[#F4F5F8] p-3">
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("bold") ? "primary" : "secondary"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            Bold
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("italic") ? "primary" : "secondary"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            Italic
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("heading", { level: 2 }) ? "primary" : "secondary"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("heading", { level: 3 }) ? "primary" : "secondary"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("bulletList") ? "primary" : "secondary"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            Bullet list
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("orderedList") ? "primary" : "secondary"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            Ordered list
          </Button>
          <Button
            type="button"
            size="sm"
            variant={editor.isActive("link") ? "primary" : "secondary"}
            onClick={setLink}
          >
            Link
          </Button>
          <ImageUpload
            folder="blogs/inline"
            value={null}
            onChange={insertImage}
            buttonLabel="Image upload"
            showPreview={false}
          />
        </div>
      ) : null}

      <EditorContent
        editor={editor}
        className={cn(
          "[&_a]:font-medium [&_a]:text-[#121F38] [&_a:hover]:text-[#1A2D4F]",
          "[&_h2]:font-mono [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-[#121F38]",
          "[&_h3]:font-mono [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:text-[#121F38]",
          "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
          "[&_ol]:list-decimal [&_ol]:pl-6",
          "[&_p]:my-4",
          "[&_ul]:list-disc [&_ul]:pl-6",
        )}
      />
    </div>
  );
}
