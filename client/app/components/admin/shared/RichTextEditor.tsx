import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code as CodeIcon,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(sanitizeHtml(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none",
      },
    },
  });

  // Keep editor in sync with external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Enter Image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden focus-within:border-custom-color-31/40 transition-colors">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("bold")
                ? "bg-custom-color-32/20 text-custom-color-33"
                : "text-admin-foreground/60",
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("italic")
                ? "bg-custom-color-34/20 text-custom-color-35"
                : "text-admin-foreground/60",
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("strike")
                ? "bg-custom-color-36/20 text-custom-color-37"
                : "text-admin-foreground/60",
            )}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("heading", { level: 1 })
                ? "bg-custom-color-38/20 text-custom-color-39"
                : "text-admin-foreground/60",
            )}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("heading", { level: 2 })
                ? "bg-custom-color-40/20 text-custom-color-41"
                : "text-admin-foreground/60",
            )}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("bulletList")
                ? "bg-custom-color-42/20 text-custom-color-43"
                : "text-admin-foreground/60",
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("orderedList")
                ? "bg-custom-color-44/20 text-custom-color-45"
                : "text-admin-foreground/60",
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("blockquote")
                ? "bg-custom-color-46/20 text-custom-color-47"
                : "text-admin-foreground/60",
            )}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              "h-8 w-8",
              editor.isActive("codeBlock")
                ? "bg-custom-color-48/20 text-custom-color-49"
                : "text-admin-foreground/60",
            )}
          >
            <CodeIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleLink}
            className={cn(
              "h-8 w-8",
              editor.isActive("link")
                ? "bg-custom-color-50/20 text-custom-color-51"
                : "text-admin-foreground/60",
            )}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={addImage}
            className="h-8 w-8 text-admin-foreground/60"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 text-admin-foreground/40 disabled:opacity-20"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 text-admin-foreground/40 disabled:opacity-20"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-custom-space-63 cursor-text bg-transparent">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
