import React from "react";

/* shadcn components */
import { Avatar, AvatarImage, AvatarFallback } from "@/common/components/ui/avatar";
import { Card } from "@/common/components/ui/card";

type Comment = {
  id: number | string;
  author: string;
  text: string;
  time?: string;
  avatarUrl?: string;
};

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  return (
    <Card className="p-3">
      <div className="flex gap-3 items-start">
        <Avatar>
          {comment.avatarUrl ? <AvatarImage src={comment.avatarUrl} alt="avatar" /> : <AvatarFallback>{comment.author?.charAt(0) ?? "U"}</AvatarFallback>}
        </Avatar>
        <div className="text-sm">
          <div className="font-medium">
            {comment.author}{" "}
            <span className="text-gray-400 text-xs ml-2">{comment.time ?? "just now"}</span>
          </div>
          <div className="text-gray-700 mt-1">{comment.text}</div>
        </div>
      </div>
    </Card>
  );
};

export default CommentItem;