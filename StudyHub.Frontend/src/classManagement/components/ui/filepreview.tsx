import React from "react";

export type FilePreviewProps = {
  fileName?: string;
  fileUrl: string;
};

const getExt = (nameOrUrl?: string) => {
  if (!nameOrUrl) return "";
  const parts = String(nameOrUrl).split(".");
  return parts.length > 1 ? String(parts.pop() || "").toLowerCase() : "";
};

const FilePreview: React.FC<{ file: FilePreviewProps }> = ({ file }) => {
  const url = file.fileUrl ?? "";
  const name = file.fileName ?? "";
  const ext = getExt(name || url);

  const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url) || ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
  const isPdf = ext === "pdf" || /\.pdf$/i.test(url);

  const getDisplayName = (): { text: string; full: string } => {
    try {
      const parsed = new URL(name, window.location.href);
      const short = parsed.hostname + (parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "");
      return { text: short, full: name };
    } catch {
      try {
        const parsedUrl = new URL(url, window.location.href);
        const short = parsedUrl.hostname + (parsedUrl.pathname && parsedUrl.pathname !== "/" ? parsedUrl.pathname : "");
        return { text: short, full: url };
      } catch {
        const max = 120;
        if (name.length > max) return { text: name.slice(0, max) + "...", full: name };
        return { text: name || url, full: name || url };
      }
    }
  };

  const display = getDisplayName();

  const renderThumb = () => {
    if (isImage) {
      return (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }
    if (isPdf) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-red-50 text-red-600">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
            <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-700">
        <div className="text-xs font-medium">{ext ? ext.toUpperCase() : "FILE"}</div>
      </div>
    );
  };

  // If no file URL, render a non-interactive preview (prevents accidental navigation)
  if (!url) {
    return (
      <div
        className="w-full flex items-center gap-3 bg-white border rounded overflow-hidden px-3 py-2"
        title={display.full}
        style={{ maxWidth: "100%", boxSizing: "border-box", overflow: "hidden", wordBreak: "break-all", whiteSpace: "normal" }}
      >
        <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">{renderThumb()}</div>
        <div className="flex-1 min-w-0" style={{ overflow: "hidden" }}>
          <div
            className="text-sm text-gray-800 underline decoration-dashed"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              whiteSpace: "normal",
              hyphens: "auto",
              lineHeight: "1.15rem",
              maxHeight: "2.4rem",
            }}
          >
            {display.text}
          </div>
          <div className="text-xs text-gray-500 mt-1" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {isPdf ? "PDF" : isImage ? "Image" : (ext ? ext.toUpperCase() : "File")}
          </div>
        </div>
        <div className="text-xs text-blue-600 ml-3 flex-shrink-0">Tải xuống</div>
      </div>
    );
  }

  // For clickable links, stop propagation so parent handlers (cards/forms) don't react
  const handleClick = (e: React.MouseEvent) => {
    // prevent parent onClick / form submit from firing
    e.stopPropagation();
    e.preventDefault();
    // allow default for anchor (open in new tab) — do not call preventDefault()
    // if you want to always open via JS: e.preventDefault(); window.open(url,'_blank');
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="w-full flex items-center gap-3 bg-white border rounded overflow-hidden px-3 py-2 hover:shadow transition"
      title={display.full}
      style={{ maxWidth: "100%", boxSizing: "border-box", overflow: "hidden", wordBreak: "break-all", whiteSpace: "normal" }}
    >
      <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">{renderThumb()}</div>

      <div className="flex-1 min-w-0" style={{ overflow: "hidden" }}>
        <div
          className="text-sm text-gray-800 underline decoration-dashed"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            whiteSpace: "normal",
            hyphens: "auto",
            lineHeight: "1.15rem",
            maxHeight: "2.4rem",
          }}
        >
          {display.text}
        </div>

        <div className="text-xs text-gray-500 mt-1" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {isPdf ? "PDF" : isImage ? "Image" : (ext ? ext.toUpperCase() : "File")}
        </div>
      </div>

      <div className="text-xs text-blue-600 ml-3 flex-shrink-0">Tải xuống</div>
    </a>
  );
};

export default FilePreview;