import React from "react";

type Comment = {
  id: number | string;
  author: string;
  text: string;
  time?: string;
  avatarUrl?: string;
};

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  return (
    <div className="flex gap-3 items-start">
      <img src={comment.avatarUrl ?? "/vite.svg"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
      <div className="text-sm">
        <div className="font-medium">{comment.author} <span className="text-gray-400 text-xs ml-2">{comment.time ?? "just now"}</span></div>
        <div className="text-gray-700 mt-1">{comment.text}</div>
      </div>
    </div>
  );
};

export default CommentItem;