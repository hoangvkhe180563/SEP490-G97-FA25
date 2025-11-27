import React, { useState } from "react";

/* shadcn components */
import { Avatar, AvatarImage, AvatarFallback } from "@/common/components/ui/avatar";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";

type Props = {
  avatarUrl?: string;
  placeholder?: string;
  onSend: (text: string) => void;
};

const CommentComposer: React.FC<Props> = ({ avatarUrl, placeholder = "Viết bình luận...", onSend }) => {
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
      <Avatar>
        <AvatarImage src={avatarUrl ?? "/vite.svg"} alt="avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="min-h-[40px]"
        />
      </div>

      <div>
        <Button type="submit" disabled={!text.trim()}>
          Send
        </Button>
      </div>
    </form>
  );
};

export default CommentComposer;