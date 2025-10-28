import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  FileText,
  Maximize,
  RotateCw,
  BookOpen,
  FileIcon,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Hand,
  MousePointer2,
} from "lucide-react";
import { Button } from "@/common/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import { Separator } from "@/common/components/ui/separator";
import { Input } from "@/common/components/ui/input";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import HTMLFlipBook from "react-pageflip";

interface PdfOutlineItem {
  title: string;
  page: number;
}

interface PdfPage {
  getViewport: (params: { scale: number; rotation?: number }) => {
    width: number;
    height: number;
  };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => {
    promise: Promise<void>;
  };
}

interface PdfDocument {
  numPages: number;
  getOutline: () => Promise<Array<{ title: string; dest: unknown }> | null>;
  getPage: (num: number) => Promise<PdfPage>;
}

interface PdfJs {
  getDocument: (params: { data: ArrayBuffer }) => {
    promise: Promise<PdfDocument>;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

type ViewMode = "normal" | "flipbook";
type InteractionMode = "pointer" | "hand";

interface FlipBookRef {
  pageFlip: () => {
    flip: (page: number) => void;
    flipNext: () => void;
    flipPrev: () => void;
  };
}

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [numPages, setNumPages] = useState(0);
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageInput, setPageInput] = useState("1");
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [flipbookRotation, setFlipbookRotation] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>("pointer");

  const {
    document,
    isLoading,
    getDocumentById,
    previewDocument,
    downloadDocument,
  } = useDocumentStore();
  const pdfDocRef = useRef<PdfDocument | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const flipBookRef = useRef<FlipBookRef | null>(null);
  const pageObserverRef = useRef<IntersectionObserver | null>(null);
  const flipbookContainerRef = useRef<HTMLDivElement>(null);

  const isPdf = document?.fileType?.toLowerCase().includes("pdf");
  const isOfficeFile =
    document?.fileType &&
    (document.fileType.toLowerCase().includes("word") ||
      document.fileType.toLowerCase().includes("presentation") ||
      document.fileType.toLowerCase().includes("sheet") ||
      document.fileType.toLowerCase().includes("doc") ||
      document.fileType.toLowerCase().includes("ppt") ||
      document.fileType.toLowerCase().includes("xls"));

  const loadPdfDocument = useCallback(async (blob: Blob) => {
    const pdfjsLib = (window as Window & { pdfjsLib?: PdfJs }).pdfjsLib;
    if (!pdfjsLib) return;

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);

      const pdfOutline = await pdf.getOutline();
      if (pdfOutline) {
        const flatOutline = pdfOutline.map(
          (item: { title: string }, idx: number) => ({
            title: item.title,
            page: idx + 1,
          })
        );
        setOutline(flatOutline);
      }
    } catch (error) {
      console.error("PDF load error:", error);
    }
  }, []);

  const renderPdfPageToCanvas = useCallback(
    async (
      pageNum: number,
      scale = 1.5,
      customRotation = 0
    ): Promise<string> => {
      if (!pdfDocRef.current) return "";

      try {
        const page = await pdfDocRef.current.getPage(pageNum);
        const viewport = page.getViewport({ scale, rotation: customRotation });
        const canvas = window.document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) return "";

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        return canvas.toDataURL();
      } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
        return "";
      }
    },
    []
  );

  const loadPreview = useCallback(async () => {
    setIsContentLoading(true);
    if (id) {
      const blob = await previewDocument(Number(id));
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);

        if (blob.type === "application/pdf") {
          await loadPdfDocument(blob);
        }
      }
    }
    setIsContentLoading(false);
  }, [id, previewDocument, loadPdfDocument]);

  useEffect(() => {
    const script = window.document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const win = window as Window & { pdfjsLib?: PdfJs };
      if (win.pdfjsLib) {
        win.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
    };
    window.document.body.appendChild(script);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement);
    };
    window.document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      if (window.document.body.contains(script)) {
        window.document.body.removeChild(script);
      }
      window.document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    if (id) {
      getDocumentById(Number(id));
      loadPreview();
    }
  }, [id, getDocumentById, loadPreview]);

  useEffect(() => {
    const loadInitialPages = async () => {
      if (
        isPdf &&
        pdfDocRef.current &&
        numPages > 0 &&
        pageImages.length === 0
      ) {
        const pagesToLoad = Math.min(3, numPages);
        const promises = [];
        const baseScale = viewMode === "normal" ? (zoom / 100) * 1.2 : 1.5;

        for (let i = 1; i <= pagesToLoad; i++) {
          promises.push(renderPdfPageToCanvas(i, baseScale));
        }

        const images = await Promise.all(promises);
        setPageImages(images);
      }
    };

    loadInitialPages();
  }, [
    isPdf,
    numPages,
    renderPdfPageToCanvas,
    viewMode,
    pageImages.length,
    zoom,
  ]);

  useEffect(() => {
    if (!isPdf || !scrollContainerRef.current || viewMode !== "normal") return;

    const options = {
      root: scrollContainerRef.current,
      threshold: 0.5,
    };

    pageObserverRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = Number.parseInt(
            entry.target.getAttribute("data-page") || "1"
          );
          setCurrentPage(pageNum);
        }
      });
    }, options);

    const pageElements =
      scrollContainerRef.current.querySelectorAll("[data-page]");
    pageElements.forEach((el) => pageObserverRef.current?.observe(el));

    return () => {
      pageObserverRef.current?.disconnect();
    };
  }, [isPdf, viewMode, pageImages.length]);

  useEffect(() => {
    const loadMorePages = async () => {
      if (isPdf && pdfDocRef.current && viewMode === "normal") {
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(numPages, currentPage + 2);

        for (let i = start; i <= end; i++) {
          if (!pageImages[i - 1]) {
            const img = await renderPdfPageToCanvas(i, (zoom / 100) * 1.2);
            setPageImages((prev) => {
              const newImages = [...prev];
              newImages[i - 1] = img;
              return newImages;
            });
          }
        }
      }
    };
    loadMorePages();
  }, [
    currentPage,
    viewMode,
    isPdf,
    numPages,
    pageImages,
    renderPdfPageToCanvas,
    zoom,
  ]);

  useEffect(() => {
    const loadFlipbookPages = async () => {
      if (isPdf && pdfDocRef.current && viewMode === "flipbook") {
        const start = Math.max(1, currentPage - 5);
        const end = Math.min(numPages, currentPage + 5);

        for (let i = start; i <= end; i++) {
          if (!pageImages[i - 1]) {
            const img = await renderPdfPageToCanvas(i, 1.5);
            setPageImages((prev) => {
              const newImages = [...prev];
              newImages[i - 1] = img;
              return newImages;
            });
          }
        }
      }
    };
    loadFlipbookPages();
  }, [
    currentPage,
    viewMode,
    isPdf,
    numPages,
    pageImages,
    renderPdfPageToCanvas,
  ]);

  useEffect(() => {
    const loadThumbnails = async () => {
      const start = Math.max(0, currentPage - 5);
      const end = Math.min(numPages, currentPage + 5);

      for (let i = start; i < end; i++) {
        if (!thumbnails[i] && pdfDocRef.current) {
          const img = await renderPdfPageToCanvas(i + 1, 0.3, 0);
          setThumbnails((prev) => {
            const newThumbs = [...prev];
            newThumbs[i] = img;
            return newThumbs;
          });
        }
      }
    };

    if (isPdf && numPages > 0) {
      loadThumbnails();
    }
  }, [currentPage, numPages, thumbnails, isPdf, renderPdfPageToCanvas]);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, numPages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === "flipbook" && interactionMode === "hand") {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewMode === "flipbook" && interactionMode === "hand") {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleRotate = () => {
    if (viewMode === "flipbook") {
      setFlipbookRotation((prev) => (prev + 90) % 360);
    } else {
      setRotation((prev) => (prev + 90) % 360);
    }
  };

  const handleAutoFit = () => {
    setZoom(100);
  };

  const handleFullscreen = () => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen();
    } else {
      window.document.exitFullscreen();
    }
  };

  const handleDownload = async () => {
    if (id && document && !isDownloading) {
      setIsDownloading(true);
      try {
        const blob = await downloadDocument(Number(id));
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const anchor = window.document.createElement("a");
          anchor.href = url;
          anchor.download = document.name || "document";
          anchor.click();
          window.URL.revokeObjectURL(url);
        }
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "normal" ? "flipbook" : "normal"));
    setRotation(0);
    setFlipbookRotation(0);
    setInteractionMode("pointer");
    setDragOffset({ x: 0, y: 0 });
  };

  const toggleInteractionMode = () => {
    setInteractionMode((prev) => (prev === "pointer" ? "hand" : "pointer"));
  };

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= numPages) {
        setCurrentPage(page);

        if (viewMode === "flipbook" && flipBookRef.current) {
          try {
            flipBookRef.current.pageFlip().flip(page - 1);
          } catch (error) {
            console.error("Error flipping page:", error);
          }
        } else if (viewMode === "normal" && scrollContainerRef.current) {
          const pageElement = scrollContainerRef.current.querySelector(
            `[data-page="${page}"]`
          );
          if (pageElement) {
            pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }
    },
    [numPages, viewMode]
  );

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = Number.parseInt(pageInput);
    if (!isNaN(page)) {
      handlePageChange(page);
    }
  };

  const handlePageInputBlur = () => {
    const page = Number.parseInt(pageInput);
    if (isNaN(page) || page < 1 || page > numPages) {
      setPageInput(currentPage.toString());
    }
  };

  const handleFlipbookFlip = (e: { data: number }) => {
    setCurrentPage(e.data + 1);
  };

  if (isLoading && !document) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  const canFlipbook = isPdf && numPages > 0;

  return (
    <>
      <style>{`
        .page {
          background-color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .page img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          user-select: none;
          pointer-events: none;
        }
        .stf__wrapper {
          overflow: hidden !important;
        }
        .stf__parent {
          overflow: hidden !important;
        }
        .stf__block {
          pointer-events: auto !important;
        }
        .stf__item {
          pointer-events: auto !important;
        }
        .stf__hardShadow,
        .stf__softShadow {
          display: none !important;
        }
      `}</style>

      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">
                  {document?.name || "Tên Tài liệu"}
                </h1>
                <p className="text-xs text-gray-500">
                  {document?.subjectName || "Môn học"} • Lớp{" "}
                  {document?.grade || ""} • {document?.fileType || "PDF"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canFlipbook && (
                <Button variant="outline" size="sm" onClick={toggleViewMode}>
                  {viewMode === "normal" ? (
                    <BookOpen className="w-4 h-4 mr-1" />
                  ) : (
                    <FileIcon className="w-4 h-4 mr-1" />
                  )}
                  {viewMode === "normal" ? "Lật sách" : "Thường"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1" />
                )}
                Tải về
              </Button>
              <Button variant="outline" size="sm" onClick={handleFullscreen}>
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 mr-1" />
                ) : (
                  <Maximize className="w-4 h-4 mr-1" />
                )}
                {isFullscreen ? "Thu nhỏ" : "Toàn màn"}
              </Button>

              {isPdf && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  {viewMode === "flipbook" && (
                    <Button
                      variant={
                        interactionMode === "hand" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={toggleInteractionMode}
                    >
                      {interactionMode === "pointer" ? (
                        <Hand className="w-4 h-4" />
                      ) : (
                        <MousePointer2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAutoFit}>
                    Vừa khít
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[50px] text-center">
                    {zoom}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </>
              )}

              {numPages > 0 && (
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <form
                    onSubmit={handlePageSubmit}
                    className="flex items-center gap-1"
                  >
                    <Input
                      type="text"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={handlePageInputBlur}
                      className="w-12 h-8 text-center text-sm"
                    />
                    <span className="text-sm text-gray-600">/ {numPages}</span>
                  </form>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= numPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {(isPdf || isOfficeFile) && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  >
                    {isSidebarOpen ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex-1 bg-gray-100 flex justify-center p-4"
            style={{ overflow: viewMode === "flipbook" ? "hidden" : "auto" }}
          >
            {isContentLoading ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    Đang tải nội dung...
                  </p>
                </div>
              </div>
            ) : isPdf ? (
              viewMode === "normal" ? (
                <div
                  className="w-full max-w-5xl"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top center",
                  }}
                >
                  {Array.from({ length: numPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <div key={pageNum} data-page={pageNum} className="mb-6">
                        <div
                          className="bg-white shadow-lg mx-auto relative"
                          style={{
                            minHeight: "600px",
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: "center center",
                          }}
                        >
                          {pageImages[pageNum - 1] ? (
                            <img
                              src={
                                pageImages[pageNum - 1] || "/placeholder.svg"
                              }
                              alt={`Page ${pageNum}`}
                              className="w-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div
                  ref={flipbookContainerRef}
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                  style={{
                    cursor:
                      interactionMode === "hand"
                        ? isDragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                  {numPages === 0 ? (
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  ) : (
                    <div
                      style={{
                        transform: `translate(${dragOffset.x}px, ${
                          dragOffset.y
                        }px) scale(${
                          zoom / 100
                        }) rotate(${flipbookRotation}deg)`,
                        transformOrigin: "center center",
                        transition: isDragging
                          ? "none"
                          : "transform 0.1s ease-out",
                        pointerEvents:
                          interactionMode === "hand" ? "none" : "auto",
                      }}
                    >
                      <HTMLFlipBook
                        width={550}
                        height={733}
                        size="fixed"
                        minWidth={315}
                        maxWidth={1000}
                        minHeight={400}
                        maxHeight={1533}
                        maxShadowOpacity={0.5}
                        showCover={false}
                        mobileScrollSupport={false}
                        onFlip={handleFlipbookFlip}
                        className="shadow-2xl"
                        startPage={currentPage - 1}
                        ref={flipBookRef}
                        style={{
                          pointerEvents:
                            interactionMode === "pointer" ? "auto" : "none",
                        }}
                        drawShadow={true}
                        flippingTime={600}
                        usePortrait={false}
                        startZIndex={0}
                        autoSize={false}
                        clickEventForward={false}
                        useMouseEvents={interactionMode === "pointer"}
                        swipeDistance={50}
                        showPageCorners={false}
                        disableFlipByClick={true}
                      >
                        {Array.from({ length: numPages }, (_, idx) => (
                          <div key={idx} className="page">
                            {pageImages[idx] ? (
                              <img
                                src={pageImages[idx] || "/placeholder.svg"}
                                alt={`Page ${idx + 1}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                              </div>
                            )}
                          </div>
                        ))}
                      </HTMLFlipBook>
                    </div>
                  )}
                </div>
              )
            ) : isOfficeFile ? (
              <div className="w-full max-w-6xl">
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                    document?.documentUrl || ""
                  )}&embedded=true`}
                  className="w-full bg-white shadow-lg rounded"
                  style={{ height: "calc(100vh - 100px)" }}
                  title="Office Document Preview"
                />
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Lưu ý:</p>
                  <p>
                    File {document?.fileType} đang được xem qua Google Docs
                    Viewer. Nếu không hiển thị, vui lòng tải về để xem.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-6xl">
                {!previewUrl ? (
                  <div className="flex items-center justifycenter h-full">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: "center center",
                    }}
                  >
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Document preview"
                      className="w-full bg-white shadow-lg rounded"
                      style={{
                        maxHeight: "calc(100vh - 100px)",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${
              isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
            }`}
          >
            {isPdf && (
              <Tabs defaultValue="info" className="flex flex-col h-full">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                  <TabsTrigger value="toc" className="text-xs">
                    Mục lục
                  </TabsTrigger>
                  <TabsTrigger value="pages" className="text-xs">
                    Trang
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-xs">
                    Thông tin
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="toc" className="p-3 mt-0">
                    {!outline || outline.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Tài liệu không có mục lục
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {outline.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handlePageChange(item.page)}
                            className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          >
                            {item.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pages" className="p-3 mt-0">
                    {numPages === 0 ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: numPages }, (_, i) => i + 1).map(
                          (pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`border rounded hover:border-blue-500 transition-colors bg-white flex flex-col items-center p-2 ${
                                currentPage === pageNum
                                  ? "border-blue-500 ring-1 ring-blue-200"
                                  : "border-gray-200"
                              }`}
                            >
                              {thumbnails[pageNum - 1] ? (
                                <img
                                  src={
                                    thumbnails[pageNum - 1] ||
                                    "/placeholder.svg"
                                  }
                                  alt={`Page ${pageNum}`}
                                  className="w-full h-24 object-contain rounded border border-gray-100 mb-1"
                                />
                              ) : (
                                <div className="w-full h-24 bg-gray-50 rounded border border-gray-100 flex items-center justify-center mb-1">
                                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                {pageNum}
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="info" className="p-3 mt-0">
                    <div className="space-y-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                          <FileText className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="font-semibold text-xs">
                          {document?.name || "Tài liệu"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {document?.fileType || "PDF"} -{" "}
                          {document?.categoryName || "Tài liệu"} - Lớp{" "}
                          {document?.grade || ""}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold text-xs mb-2">
                          Thông tin
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Loại tài liệu</span>
                            <span className="font-medium text-right">
                              {document?.categoryName || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Môn học</span>
                            <span className="font-medium text-right">
                              {document?.subjectName || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Khối</span>
                            <span className="font-medium text-right">
                              Lớp {document?.grade || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Ngày tạo</span>
                            <span className="font-medium text-right">
                              {document?.createdAt
                                ? new Date(
                                    document.createdAt
                                  ).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Người đăng</span>
                            <span className="font-medium text-right">
                              {document?.uploaderName || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">
                              Quyền truy cập
                            </span>
                            <span className="font-medium text-right">
                              {document?.schoolId ? "Trường học" : "Công khai"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            )}
            {isOfficeFile && isSidebarOpen && (
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                      <FileText className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-xs">
                      {document?.name || "Tài liệu"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {document?.fileType || "Office"} -{" "}
                      {document?.categoryName || "Tài liệu"} - Lớp{" "}
                      {document?.grade || ""}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold text-xs mb-2">Thông tin</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Loại tài liệu</span>
                        <span className="font-medium text-right">
                          {document?.categoryName || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Môn học</span>
                        <span className="font-medium text-right">
                          {document?.subjectName || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Khối</span>
                        <span className="font-medium text-right">
                          Lớp {document?.grade || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Ngày tạo</span>
                        <span className="font-medium text-right">
                          {document?.createdAt
                            ? new Date(document.createdAt).toLocaleDateString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Người đăng</span>
                        <span className="font-medium text-right">
                          {document?.uploaderName || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Quyền truy cập</span>
                        <span className="font-medium text-right">
                          {document?.schoolId ? "Trường học" : "Công khai"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
