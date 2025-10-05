import React, { useState } from "react";
import CommentComposer from "@/common/components/ui/commentcomposer";
export type Post = {
  id: number | string;
  author: string;
  avatarUrl?: string;
  time?: string;
  content: string;
  attachmentLabel?: string;
  comments?: { id: number | string; author: string; text: string; avatarUrl?: string; time?: string }[];
};

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
const [localComments, setLocalComments] = useState(post.comments ?? []);
const handleSendComment = (text: string) => {
    const newComment = {
      id: Date.now(),
      author: "You",
      text,
      avatarUrl: "/vite.svg",
      time: "just now",
    };
    setLocalComments((c) => [...c, newComment]);
    setShowComments(true);
    // optionally call API here
  };
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-start gap-4">
        <img src={post.avatarUrl ?? "/vite.svg"} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{post.author}</div>
              <div className="text-xs text-gray-400">{post.time ?? "just now"}</div>
            </div>
            <div className="text-sm text-gray-400">...</div>
          </div>

          <div className="mt-3 text-gray-800">{post.content}</div>

          {post.attachmentLabel && (
            <div className="mt-3 bg-gray-50 border rounded p-3 flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none"><path d="M12 3v10" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7h8" stroke="currentColor" strokeWidth="1.5"/></svg>
              <div>{post.attachmentLabel}</div>
            </div>
          )}

          <div className="mt-4 border-t pt-3 flex items-center justify-between text-sm text-gray-500">
            <button className="flex items-center gap-2" onClick={() => setShowComments((s) => !s)}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5"/></svg>
              {post.comments?.length ?? 0} comments
            </button>
            <div className="text-gray-400">Share</div>
          </div>
          <div className="mt-4">
        <CommentComposer onSend={handleSendComment} avatarUrl="/vite.svg" />
      </div>
         {showComments && localComments.length > 0 && (
        <div className="mt-3 space-y-3">
          {localComments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start">
              <img src={c.avatarUrl ?? "/vite.svg"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              <div className="text-sm">
                <div className="font-medium">{c.author} <span className="text-gray-400 text-xs ml-2">{c.time ?? "just now"}</span></div>
                <div className="text-gray-700 mt-1">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default PostCard;