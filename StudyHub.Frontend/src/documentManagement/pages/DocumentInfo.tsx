import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Download, ZoomIn, ZoomOut, FileText, Maximize } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/components/ui/tabs";
import { Separator } from "@/common/components/ui/separator";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import type { DocumentDetailDto } from "@/documentManagement/interfaces/documentApi";

interface PdfOutlineItem {
  title: string;
  page: number;
}

interface PdfJs {
  getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getOutline: () => Promise<Array<{ title: string }> | null> }> };
  GlobalWorkerOptions: { workerSrc: string };
}

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [numPages, setNumPages] = useState(0);
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const { document, isLoading, getDocumentById, previewDocument, downloadDocument } = useDocumentStore();

  const loadPreview = useCallback(async () => {
    if (id) {
      const blob = await previewDocument(Number(id));
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        if (blob.type === 'application/pdf') {
          loadPdfMetadata(blob);
        }
      }
    }
  }, [id, previewDocument]);

  const loadPdfMetadata = async (blob: Blob) => {
    const pdfjsLib = (window as Window & { pdfjsLib?: PdfJs }).pdfjsLib;
    if (pdfjsLib) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setNumPages(pdf.numPages);
        
        const pdfOutline = await pdf.getOutline();
        if (pdfOutline) {
          const flatOutline = pdfOutline.map((item: { title: string }) => ({
            title: item.title,
            page: 1
          }));
          setOutline(flatOutline);
        }
      } catch {
        console.log('PDF metadata not available');
      }
    }
  };

  useEffect(() => {
    const script = window.document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const win = window as Window & { pdfjsLib?: PdfJs };
      if (win.pdfjsLib) {
        win.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    };
    window.document.body.appendChild(script);

    return () => {
      if (window.document.body.contains(script)) {
        window.document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (id) {
      getDocumentById(Number(id));
      loadPreview();
    }
  }, [id, getDocumentById, loadPreview]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  const handleFullscreen = () => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen();
    } else {
      window.document.exitFullscreen();
    }
  };

  const handleDownload = async () => {
    if (id && document) {
      const blob = await downloadDocument(Number(id));
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = document.name || 'document';
        anchor.click();
        window.URL.revokeObjectURL(url);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <DocumentHeader 
        document={document} 
        zoom={zoom} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut}
        onDownload={handleDownload}
        onFullscreen={handleFullscreen}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center p-4">
          <DocumentContent zoom={zoom} previewUrl={previewUrl} />
        </div>

        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <DocumentSidebar document={document} numPages={numPages} outline={outline} />
        </div>
      </div>
    </div>
  );
}

function DocumentHeader({ 
  document, 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onDownload,
  onFullscreen 
}: { 
  document: DocumentDetailDto | null;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload: () => void;
  onFullscreen: () => void;
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{document?.name || "Tên Tài liệu"}</h1>
            <p className="text-xs text-gray-500">
              {document?.subjectName || "Môn học"} • Lớp {document?.grade || ""} • {document?.fileType || "PDF"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="w-4 h-4 mr-1" />
            Tải về
          </Button>
          <Button variant="outline" size="sm" onClick={onFullscreen}>
            <Maximize className="w-4 h-4 mr-1" />
            Toàn màn hình
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={onZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[50px] text-center">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={onZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentContent({ zoom, previewUrl }: { zoom: number; previewUrl: string }) {
  if (previewUrl) {
    return (
      <div className="w-full max-w-6xl">
        <iframe
          src={previewUrl}
          className="w-full bg-white shadow-lg rounded"
          style={{
            height: 'calc(100vh - 100px)',
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
          title="Document Preview"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="bg-white p-12 shadow-lg rounded">
        <p className="text-center text-gray-400">Đang tải nội dung tài liệu...</p>
      </div>
    </div>
  );
}

function DocumentSidebar({ 
  document, 
  numPages, 
  outline 
}: { 
  document: DocumentDetailDto | null;
  numPages: number;
  outline: PdfOutlineItem[];
}) {
  return (
    <Tabs defaultValue="pages" className="flex flex-col h-full">
      <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
        <TabsTrigger value="toc" className="text-xs">Mục lục</TabsTrigger>
        <TabsTrigger value="pages" className="text-xs">Trang</TabsTrigger>
        <TabsTrigger value="info" className="text-xs">Thông tin</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-y-auto">
        <TabsContent value="toc" className="p-4 mt-0">
          <TableOfContents outline={outline} />
        </TabsContent>

        <TabsContent value="pages" className="p-4 mt-0">
          <PageThumbnails numPages={numPages} />
        </TabsContent>

        <TabsContent value="info" className="p-4 mt-0">
          <DocumentInfo document={document} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function TableOfContents({ outline }: { outline: PdfOutlineItem[] }) {
  if (!outline || outline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Tài liệu không có mục lục
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {outline.map((item, index) => (
        <button
          key={index}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}

function PageThumbnails({ numPages }: { numPages: number }) {
  if (numPages === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Đang tải danh sách trang...
      </div>
    );
  }

  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      {pages.map((pageNum) => (
        <button
          key={pageNum}
          className="w-full aspect-[8.5/11] border-2 border-gray-200 rounded hover:border-blue-500 transition-colors bg-white flex flex-col items-center justify-center p-2"
        >
          <div className="text-xs text-gray-500 mb-1">Trang {pageNum}</div>
          <div className="w-full h-full bg-gray-50 rounded"></div>
        </button>
      ))}
    </div>
  );
}

function DocumentInfo({ document }: { document: DocumentDetailDto | null }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
          <FileText className="w-10 h-10 text-gray-600" />
        </div>
        <h3 className="font-semibold text-sm">{document?.name || "Tài liệu"}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {document?.fileType || "PDF"} - {document?.categoryName || "Tài liệu"} - Lớp {document?.grade || ""}
        </p>
      </div>

      <Separator />

      <div>
        <h4 className="font-semibold text-sm mb-3">Thông tin</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ngày tạo</span>
            <span className="font-medium text-right">
              {document?.createdAt ? new Date(document.createdAt).toLocaleDateString('vi-VN') : "N/A"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Người tạo</span>
            <span className="font-medium text-right">{document?.createdBy || "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quyền truy cập</span>
            <span className="font-medium text-right">{document?.schoolId ? "Trường học" : "Công khai"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}