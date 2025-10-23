import React, { useRef, useState } from "react";

type Props = {
  onPost: (content: string, files?: File[]) => Promise<void> | void;
  avatarUrl?: string;
  placeholder?: string;
  maxFiles?: number;
  accept?: string;
};

const Icon = ({ children }: { children: React.ReactNode }) => (
  <div className="w-10 h-10 rounded-full border flex items-center justify-center bg-white">
    {children}
  </div>
);

const ToolbarButton: React.FC<{
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}> = ({ onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="p-1 rounded hover:bg-gray-100"
  >
    {children}
  </button>
);

const PostComposer: React.FC<Props> = ({
  onPost,
  avatarUrl = "/vite.svg",
  placeholder = "Thông báo nội dung nào đó cho lớp học của bạn",
  maxFiles = 5,
  accept = ".png,.jpg,.jpeg,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx",
}) => {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const spaceLeft = Math.max(0, maxFiles - files.length);
    const toAdd = arr.slice(0, spaceLeft);
    setFiles((f) => [...f, ...toAdd]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Simple selection wrapper to insert markdown-like formatting
  const wrapSelection = (before: string, after?: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.slice(start, end);
    const a = after ?? before;
    const newText = content.slice(0, start) + before + sel + a + content.slice(end);
    setContent(newText);
    // place caret after inserted format
    const pos = start + before.length + sel.length + a.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const makeList = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = content.slice(start, end) || "";
    const lines = sel.split("\n");
    const newLines = lines.map((l) => (l.trim() ? `- ${l}` : l));
    const newText =
      content.slice(0, start) + newLines.join("\n") + content.slice(end);
    setContent(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start, start + newLines.join("\n").length);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) return;
    try {
      setIsPosting(true);
      await onPost(content.trim(), files.length ? files : undefined);
      // on success clear
      setContent("");
      setFiles([]);
      setExpanded(false);
    } catch (err) {
      console.error("Failed to post notification", err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setFiles([]);
    setExpanded(false);
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex gap-4">
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          {!expanded ? (
            <button
              onClick={() => {
                setExpanded(true);
                setTimeout(() => textareaRef.current?.focus(), 0);
              }}
              className="w-full text-left bg-gray-50 p-3 rounded border border-dashed text-gray-600 hover:bg-gray-100"
            >
              {placeholder}
            </button>
          ) : (
            <div>
              <div className="bg-gray-50 p-3 rounded">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={placeholder}
                  rows={6}
                  className="w-full resize-none bg-transparent outline-none"
                />

                {/* Formatting toolbar */}
                <div className="mt-3 border-t pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-700">
                    <ToolbarButton onClick={() => wrapSelection("**") } title="Bold">
                      <b>B</b>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => wrapSelection("*")} title="Italic">
                      <i>I</i>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => wrapSelection("<u>", "</u>")} title="Underline">
                      <span style={{ textDecoration: "underline" }}>U</span>
                    </ToolbarButton>
                    <ToolbarButton onClick={makeList} title="List">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => wrapSelection("~~")} title="Strikethrough">
                      <s>S</s>
                    </ToolbarButton>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* attachments preview small */}
                    <div className="flex items-center gap-2">
                      {files.length > 0 && (
                        <div className="text-xs text-gray-500">{files.length} file(s) attached</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments and actions area */}
              <div className="mt-3 flex items-center justify-between">
                <div
                  className="flex items-center gap-3"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <button
                    type="button"
                    onClick={() => alert("Drive integration not implemented")}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <Icon>
                      {/* Drive-like icon */}
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3 2 21h20L12 3z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                      </svg>
                    </Icon>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("YouTube embed not implemented")}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <Icon>
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
                        <path d="M22 9.5s-.2-1.6-.8-2.3c-.7-.9-1.5-.9-1.9-.9C16.6 6 12 6 12 6s-4.6 0-7.3.3c-.4 0-1.2 0-1.9.9C2.2 7.9 2 9.5 2 9.5S2 11 2 12.5v.9C2 15 2.2 16.6 2.8 17.3c.7.9 1.7.8 2.1.9 1.5.1 6.4.3 6.4.3s4.6 0 7.3-.3c.4 0 1.2 0 1.9-.9.6-.7.8-2.3.8-2.3s.2-1.5.2-3v-1c0-1.5-.2-3-.2-3z" stroke="currentColor" strokeWidth="0.3" />
                        <path d="M10 14l6-3-6-3v6z" fill="currentColor" />
                      </svg>
                    </Icon>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <Icon>
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M8 11l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 21H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </Icon>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt("Dán link vào đây");
                      if (url) setContent((c) => `${c}\n${url}`);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <Icon>
                      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
                        <path d="M10 14a3 3 0 004.24 0l3.52-3.52a3 3 0 10-4.24-4.24L10 9.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 10a3 3 0 00-4.24 0L6.24 13.52a3 3 0 104.24 4.24L14 14.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Icon>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCancel}
                    type="button"
                    className="text-blue-600 hover:underline"
                    disabled={isPosting}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isPosting || (!content.trim() && files.length === 0)}
                    className={`px-4 py-2 rounded text-white text-sm ${
                      isPosting || (!content.trim() && files.length === 0)
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isPosting ? "Đang đăng..." : "Đăng"}
                  </button>
                </div>
              </div>

              {/* file list preview */}
              {files.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white border rounded p-2">
                      <div className="truncate text-sm">
                        <span className="font-medium mr-2">{f.name}</span>
                        <span className="text-xs text-gray-400">• {(f.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={URL.createObjectURL(f)} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">
                          Preview
                        </a>
                        <button onClick={() => removeFile(idx)} className="text-red-500 text-sm">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComposer;