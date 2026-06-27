"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import { Bold, Italic } from "lucide-react";
import { useState } from "react";

const MAX_CHARS = 200;

type Props = {
  defaultValue: string;
  name: string;
};

export function ThankYouEditor({ defaultValue, name }: Props) {
  const [html, setHtml] = useState(defaultValue || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      CharacterCount.configure({ limit: MAX_CHARS }),
    ],
    content: defaultValue || "",
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "tiptap-editable" },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && view.state.doc.childCount >= 4) {
          return true;
        }
        return false;
      },
    },
  });

  const charCount = editor?.storage.characterCount.characters() ?? 0;
  const isOver = charCount >= MAX_CHARS;

  return (
    <div className="tiptap-wrapper">
      <div className="tiptap-toolbar">
        <button
          aria-label="Negrita"
          className={`tiptap-tool${editor?.isActive("bold") ? " is-active" : ""}`}
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={14} />
        </button>
        <button
          aria-label="Itálica"
          className={`tiptap-tool${editor?.isActive("italic") ? " is-active" : ""}`}
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} />
        </button>
      </div>

      <EditorContent editor={editor} className="tiptap-content" />

      <input name={name} type="hidden" value={html} />

      <span className={`tiptap-count${isOver ? " tiptap-count--over" : ""}`}>
        {charCount}/{MAX_CHARS}
      </span>
    </div>
  );
}
