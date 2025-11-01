// src/documentManagement/pages/student/DocumentDetails.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/common/components/ui/carousel";
import {
  FileText,
  Download,
  Calendar,
  Lock,
  RefreshCw,
  FileType,
  FolderOpen,
  User,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import type {
  DocumentDetailDto,
  Document,
} from "@/documentManagement/interfaces/document";

function DocumentPreview({
  thumbnail,
  fileType,
}: {
  thumbnail?: string;
  fileType?: string;
}) {
  return (
    <Card className="w-48 h-64 flex items-center justify-center overflow-hidden">
      {thumbnail ? (
        <div className="w-full h-full p-2">
          <img
            src={thumbnail}
            alt="Document preview"
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-3">
          <FileText className="w-16 h-16 text-white-400" />
          <p className="text-sm font-medium text-white-600">
            {fileType || "PDF"}
          </p>
        </div>
      )}
    </Card>
  );
}
import { axiosInstance } from "@/lib/axios";
function DocumentHeader({
  document,
  onView,
  onDownload,
  isDownloading,
}: {
  document: DocumentDetailDto | null;
  onView: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
          {document?.subjectName || "Môn học"}
        </span>
        <span className="px-4 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
          Lớp {document?.grade || ""}
        </span>
      </div>
      <h1 className="text-4xl font-bold mb-5 text-gray-900">
        {document?.name || "Tên tài liệu"}
      </h1>
      <div className="flex gap-3">
        <Button onClick={onView}>
          <FileText className="w-4 h-4 mr-2" />
          Xem tài liệu
        </Button>
        <Button variant="outline" onClick={onDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Tải xuống
        </Button>
      </div>
    </div>
  );
}

function DocumentDescription({ description }: { description?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Mô tả tài liệu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 leading-relaxed">
          {description || "Chưa có mô tả"}
        </p>
      </CardContent>
    </Card>
  );
}

function DocumentDetailsInfo({
  document,
}: {
  document: DocumentDetailDto | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Ngày tạo:
          </span>
          <span className="font-semibold">
            {document?.createdAt
              ? new Date(document.createdAt).toLocaleDateString("vi-VN")
              : "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Quyền truy cập:
          </span>
          <span className="font-semibold">
            {document?.schoolId ? "Trường học" : "Công khai"}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Lần cập nhật:
          </span>
          <span className="font-semibold">
            {document?.updatedAt
              ? new Date(document.updatedAt).toLocaleDateString("vi-VN")
              : "Chưa cập nhật"}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 flex items-center gap-2">
            <FileType className="w-4 h-4" />
            Định dạng:
          </span>
          <span className="font-semibold">{document?.fileType || "PDF"}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Danh mục:
          </span>
          <span className="font-semibold">
            {document?.categoryName || "N/A"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function UserInfo({
  uploaderName,
  onViewUploaderDocs,
}: {
  uploaderName?: string;
  onViewUploaderDocs: () => void;
}) {
  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return words[0][0] + words[words.length - 1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-5 h-5" />
          Thông tin người đăng
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback className="text-2xl font-bold">
            {uploaderName ? getInitials(uploaderName).toUpperCase() : "ND"}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-bold text-lg">{uploaderName || "Người đăng"}</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onViewUploaderDocs}
        >
          Xem thêm tài liệu của {uploaderName}
        </Button>
      </CardContent>
    </Card>
  );
}

function RelatedDocumentCard({
  document,
  onClick,
}: {
  document: Document;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow relative"
      onClick={onClick}
    >
      {document.schoolId && (
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2.5 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full shadow-sm">
            Tài liệu trường
          </span>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {document.thumbnail ? (
              <img
                src={document.thumbnail}
                alt={document.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText className="w-7 h-7 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 line-clamp-2">
              {document.name}
            </h4>
            <p className="text-xs text-gray-600">
              {document.uploaderName || "N/A"} • Lớp {document.grade}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RelatedDocumentsSection({
  subjectId,
  currentDocId,
}: {
  subjectId?: number;
  currentDocId: number;
}) {
  const [relatedDocs, setRelatedDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);
  useEffect(() => {
    const fetchRelatedDocs = async () => {
      if (!subjectId) return;

      setIsLoading(true);
      try {
        const response = await axiosInstance.get(
          `/Document/by-subject/${subjectId}`
        );

        const filtered = response.data.data
          .filter((d: Document) => d.id !== currentDocId)
          .sort(() => Math.random() - 0.5)
          .slice(0, 7);

        setRelatedDocs(filtered);
      } catch (error) {
        console.error("Error fetching related docs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedDocs();
  }, [subjectId, currentDocId]);

  const handleDocumentClick = (docId: number) => {
    window.location.href = `/document/student/details/${docId}`;
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-3">Tài liệu cùng môn học</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!relatedDocs || relatedDocs.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-3">Tài liệu cùng môn học</h2>
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">
              Không có tài liệu cùng môn
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Hãy quay lại sau để khám phá thêm tài liệu mới
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-2">Tài liệu cùng môn học</h2>
      <p className="text-xs text-gray-600 mb-3">
        Khám phá thêm các tài liệu khác
      </p>

      <div className="px-12">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: relatedDocs.length > 3,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {relatedDocs.map((d) => (
              <CarouselItem key={d.id} className="md:basis-1/2 lg:basis-1/3">
                <RelatedDocumentCard
                  document={d}
                  onClick={() => handleDocumentClick(d.id)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <div className="flex justify-center gap-2 mt-3">
        {Array.from({ length: Math.ceil(relatedDocs.length / 3) }).map(
          (_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index * 3)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                Math.floor(current / 3) === index
                  ? "bg-blue-600 w-8"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          )
        )}
      </div>
    </div>
  );
}

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { document, isLoading, getDocumentById, downloadDocument } =
    useDocumentStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const userSchoolId = 1;

  useEffect(() => {
    if (id) {
      getDocumentById(Number(id));
    }
  }, [id, getDocumentById]);

  const handleView = () => {
    navigate(`/document/student/doc-info/${id}`);
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

  const handleViewUploaderDocs = () => {
    if (document?.uploaderName) {
      const basePath = location.pathname.split("/details")[0];
      const documentsPath = basePath.replace(
        /\/(teacher|student|manager)$/,
        "/$1/documents"
      );

      const hasSchoolAccess = !!userSchoolId && !!document.schoolId;

      navigate(documentsPath, {
        state: {
          searchQuery: document.uploaderName,
          showSchoolDocs: hasSchoolAccess,
          timestamp: Date.now(),
        },
      });
    }
  };

  if (isLoading && !document) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg">
            Không tìm thấy tài liệu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-6 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="flex flex-wrap lg:flex-nowrap gap-6 mb-6">
          <DocumentPreview
            thumbnail={document.thumbnail}
            fileType={document.fileType}
          />
          <DocumentHeader
            document={document}
            onView={handleView}
            onDownload={handleDownload}
            isDownloading={isDownloading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <DocumentDescription description={document.description} />
          <DocumentDetailsInfo document={document} />
          <UserInfo
            uploaderName={document.uploaderName}
            onViewUploaderDocs={handleViewUploaderDocs}
          />
        </div>

        <RelatedDocumentsSection
          subjectId={document.subjectId}
          currentDocId={document.id}
        />
      </div>
    </div>
  );
}
