import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/common/components/ui/carousel";
import { FileText, Download } from "lucide-react";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import { documentService } from "@/documentManagement/services/documentService";
import type { DocumentDetailDto, DocumentListDto } from "@/documentManagement/interfaces/documentApi";

function DocumentPreview({ thumbnail, fileType }: { thumbnail?: string; fileType?: string }) {
  return (
    <Card className="w-40 h-48 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg transition-shadow">
      {thumbnail ? (
        <img src={thumbnail} alt="Document preview" className="w-full h-full object-cover rounded" />
      ) : (
        <>
          <div className="bg-blue-50 p-4 rounded-full mb-3">
            <FileText className="w-12 h-12 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">{fileType || "PDF"}</p>
        </>
      )}
    </Card>
  );
}

function DocumentHeader({ 
  document, 
  onView, 
  onDownload 
}: { 
  document: DocumentDetailDto | null; 
  onView: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
          {document?.subjectName || "Môn học"}
        </span>
        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
          Lớp {document?.grade || ""}
        </span>
      </div>
      <h1 className="text-3xl font-bold mb-4 text-gray-800">{document?.name || "Tên tài liệu"}</h1>
      <div className="flex gap-3">
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-md" onClick={onView}>
          <FileText className="w-4 h-4 mr-2" />
          Xem tài liệu
        </Button>
        <Button variant="outline" className="border-gray-300 hover:bg-gray-50 shadow-sm" onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Tải xuống
        </Button>
      </div>
    </div>
  );
}

function DocumentDescription({ description }: { description?: string }) {
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-base font-semibold text-gray-800">Mô tả tài liệu</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {description || "Chưa có mô tả"}
        </p>
      </CardContent>
    </Card>
  );
}

function DocumentDetailsInfo({ document }: { document: DocumentDetailDto | null }) {
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-base font-semibold text-gray-800">Thông tin chi tiết</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Ngày tạo:</span>
          <span className="font-medium text-gray-800">
            {document?.createdAt ? new Date(document.createdAt).toLocaleDateString('vi-VN') : "N/A"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quyền truy cập:</span>
          <span className="font-medium text-gray-800">
            {document?.schoolId ? "Trường học" : "Công khai"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Lần cập nhật:</span>
          <span className="font-medium text-gray-800">
            {document?.updatedAt ? new Date(document.updatedAt).toLocaleDateString('vi-VN') : "Chưa cập nhật"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Định dạng:</span>
          <span className="font-medium text-gray-800">{document?.fileType || "PDF"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Danh mục:</span>
          <span className="font-medium text-gray-800">{document?.categoryName || "N/A"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function UserInfo({ createdBy }: { createdBy?: string }) {
  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-base font-semibold text-gray-800">Thông tin người dùng</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4 pt-4">
        <Avatar className="w-20 h-20 ring-2 ring-gray-200">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl">
            {typeof createdBy === 'string' ? createdBy.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold text-base text-gray-800">{createdBy || "Người dùng"}</p>
          <p className="text-sm text-gray-600">Giáo viên</p>
        </div>
        <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
          Xem thêm tài liệu cùng tác giả
        </Button>
      </CardContent>
    </Card>
  );
}

function RelatedDocumentCard({ 
  doc,
  onClick 
}: { 
  doc: DocumentListDto;
  onClick: () => void;
}) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1.5 line-clamp-2 text-gray-800 hover:text-blue-600 transition-colors">
              {doc.name}
            </h4>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span>{doc.createdBy || "N/A"}</span>
              <span className="text-gray-300">•</span>
              <span>Lớp {doc.grade}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RelatedDocumentsSection({ 
  subjectId, 
  currentDocId 
}: { 
  subjectId?: number;
  currentDocId: number;
}) {
  const navigate = useNavigate();
  const [relatedDocs, setRelatedDocs] = useState<DocumentListDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRelatedDocs = async () => {
      if (!subjectId) return;
      
      setIsLoading(true);
      try {
        const response = await documentService.getDocumentsBySubject(subjectId);
        
        if (response.success && response.data) {
          const filtered = response.data
            .filter(doc => doc.id !== currentDocId)
            .sort(() => Math.random() - 0.5)
            .slice(0, 7)
            .map(doc => ({
              id: doc.id,
              name: doc.name,
              subjectId: doc.subjectId,
              subjectName: doc.subjectName,
              documentCategoryId: doc.documentCategoryId,
              categoryName: doc.categoryName,
              thumbnail: doc.thumbnail,
              description: doc.description,
              createdAt: doc.createdAt,
              createdBy: doc.createdBy,
              isSchoolDocument: doc.isSchoolDocument,
              isFeatured: doc.isFeatured,
              isApproved: doc.isApproved,
              schoolId: doc.schoolId,
              schoolName: doc.schoolName,
              fileType: doc.fileType,
              documentUrl: doc.documentUrl
            } as DocumentListDto));
          
          setRelatedDocs(filtered);
        }
      } catch (error) {
        console.error('Error fetching related docs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedDocs();
  }, [subjectId, currentDocId]);

  const handleDocumentClick = (docId: number) => {
    navigate(`/document/student/details/${docId}`);
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Tài liệu cùng môn học</h2>
        <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!relatedDocs || relatedDocs.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Tài liệu cùng môn học</h2>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-12 text-center border border-gray-200">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-lg">Không có tài liệu cùng môn</p>
          <p className="text-gray-500 text-sm mt-2">Hãy quay lại sau để khám phá thêm tài liệu mới</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-2 text-gray-800">Tài liệu cùng môn học</h2>
      <p className="text-sm text-gray-600 mb-6">Khám phá thêm các tài liệu khác</p>

      <Carousel
        opts={{
          align: "start",
          loop: relatedDocs.length > 3,
        }}
        className="w-full"
      >
        <CarouselContent>
          {relatedDocs.map((doc) => (
            <CarouselItem key={doc.id} className="md:basis-1/2 lg:basis-1/3">
              <RelatedDocumentCard 
                doc={doc}
                onClick={() => handleDocumentClick(doc.id)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { document, isLoading, getDocumentById, downloadDocument } = useDocumentStore();

  useEffect(() => {
    if (id) {
      getDocumentById(Number(id));
    }
  }, [id, getDocumentById]);

  const handleView = () => {
    navigate(`/document/student/doc-info/${id}`);
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-lg">Không tìm thấy tài liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex gap-6 mb-6">
          <DocumentPreview thumbnail={document.thumbnail} fileType={document.fileType} />
          <DocumentHeader document={document} onView={handleView} onDownload={handleDownload} />
          <Button variant="outline" className="self-start border-gray-300 hover:bg-gray-50 shadow-sm">
            Feedback
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DocumentDescription description={document.description} />
          <DocumentDetailsInfo document={document} />
          <UserInfo createdBy={document.createdBy} />
        </div>

        <RelatedDocumentsSection 
          subjectId={document.subjectId} 
          currentDocId={document.id}
        />
      </div>
    </div>
  );
}