import React, { useState } from "react";

type Props = {
  avatarUrl?: string;
  placeholder?: string;
  onSend: (text: string) => void;
};

const CommentComposer: React.FC<Props> = ({ avatarUrl, placeholder = "Write a comment...", onSend }) => {
  const [text, setText] = useState("");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form onSubmit={submit} className="flex items-start gap-3">
      <img src={avatarUrl ?? "/vite.svg"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
      <div className="flex-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={!text.trim()}
          className="ml-2 bg-slate-900 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default CommentComposer;