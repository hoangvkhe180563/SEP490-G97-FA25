import React, { useState } from "react";

type Props = {
  avatarUrl?: string;
  placeholder?: string;
  onPost: (content: string) => void;
};

const PostComposer: React.FC<Props> = ({ avatarUrl, placeholder = "Post content for your class...", onPost }) => {
  const [text, setText] = useState("");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onPost(text.trim());
    setText("");
  };

  return (
    <form onSubmit={submit} className="bg-white border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <img src={avatarUrl ?? "/vite.svg"} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border rounded px-4 py-2 text-sm placeholder:text-gray-400"
        />
      </div>
      <div className="mt-3 text-right">
        <button
          type="submit"
          className="bg-slate-900 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          disabled={!text.trim()}
        >
          Post
        </button>
      </div>
    </form>
  );
};

export default PostComposer;