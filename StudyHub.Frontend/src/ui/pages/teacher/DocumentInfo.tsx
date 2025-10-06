"use client"

import { useState } from "react"
import { Download, ZoomIn, ZoomOut, FileText, Maximize } from "lucide-react"
import { Button } from "@/common/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/components/ui/tabs"
import { Separator } from "@/common/components/ui/separator"

// COMPONENT: Document Viewer Page
export default function DocumentViewer() {
  const [zoom, setZoom] = useState(100)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50))

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* COMPONENT: Header with document info and actions */}
      <DocumentHeader zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

      <div className="flex flex-1 overflow-hidden">
        {/* COMPONENT: Main document viewer area (scrollable) */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
          <DocumentContent zoom={zoom} />
        </div>

        {/* COMPONENT: Fixed sidebar with tabs */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
          <DocumentSidebar />
        </div>
      </div>
    </div>
  )
}

// COMPONENT: Header
function DocumentHeader({
  zoom,
  onZoomIn,
  onZoomOut,
}: {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Tên Tài liệu</h1>
            <p className="text-xs text-gray-500">Tài liệu Hóa học • Lớp 10 Nâu • 2.4 MB • 4 trang</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Tải về
          </Button>
          <Button variant="outline" size="sm">
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
  )
}

// COMPONENT: Document content viewer
function DocumentContent({ zoom }: { zoom: number }) {
  const pages = [1, 2, 3, 4]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {pages.map((pageNum) => (
        <div
          key={pageNum}
            className="bg-white relative"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            marginBottom: zoom !== 100 ? `${(zoom - 100) * 2}px` : undefined,
          }}
        >
          <div className="aspect-[8.5/11] p-12 flex flex-col">
            {pageNum === 1 && (
              <>
                <h1 className="text-3xl font-bold text-center mb-8">Tài liệu</h1>
                <Separator className="mb-8" />
                <h2 className="text-2xl font-semibold text-center">Nội dung Tài liệu</h2>
              </>
            )}
            {pageNum > 1 && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>Nội dung trang {pageNum}</p>
              </div>
            )}
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-gray-400">Trang {pageNum}</div>
        </div>
      ))}
    </div>
  )
}

// COMPONENT: Sidebar with tabs
function DocumentSidebar() {
  return (
    <Tabs defaultValue="info" className="flex flex-col h-full">
      <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
        <TabsTrigger value="toc" className="text-xs">
          Mục lục
        </TabsTrigger>
        <TabsTrigger value="pages" className="text-xs">
          Trang
        </TabsTrigger>
        
      </TabsList>

      <div className="flex-1 overflow-y-auto">
        {/* COMPONENT: Table of Contents tab */}
        <TabsContent value="toc" className="p-4 mt-0">
          <TableOfContents />
        </TabsContent>

        {/* COMPONENT: Pages thumbnail tab */}
        <TabsContent value="pages" className="p-4 mt-0">
          <PageThumbnails />
        </TabsContent>
      </div>
    </Tabs>
  )
}

// COMPONENT: Table of contents list
function TableOfContents() {
  const tocItems = [
    "Mục lục 1",
    "Mục lục 2",
    "Mục lục 3",
    "Phụ lục 1",
    "Phụ lục 1",
    "Mục lục 6",
    "Mục lục 6",
    "Mục lục 6",
  ]

  return (
    <div className="space-y-2">
      {tocItems.map((item, index) => (
        <button
          key={index}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          {item}
        </button>
      ))}
    </div>
  )
}

// COMPONENT: Page thumbnails grid
function PageThumbnails() {
  const pages = [1, 2, 3, 4]

  return (
    <div className="grid grid-cols-2 gap-3">
      {pages.map((pageNum) => (
        <button
          key={pageNum}
          className="aspect-[8.5/11] border-2 border-gray-200 rounded hover:border-blue-500 transition-colors bg-white flex items-center justify-center"
        >
          <span className="text-xs text-gray-500">Trang {pageNum}</span>
        </button>
      ))}
    </div>
  )
}
