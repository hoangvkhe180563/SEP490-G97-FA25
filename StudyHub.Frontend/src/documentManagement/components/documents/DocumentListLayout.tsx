// src/documentManagement/components/documents/DocumentListLayout.tsx
import type { ReactNode } from "react";

interface DocumentListLayoutProps {
  searchHeader: ReactNode;
  filterSidebar: ReactNode;
  mainContent: ReactNode;
}

const DocumentListLayout = ({
  searchHeader,
  filterSidebar,
  mainContent,
}: DocumentListLayoutProps) => {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📚 Thư viện tài liệu
            </h1>
            <p className="text-gray-600">
              Khám phá và tải xuống tài liệu học tập chất lượng cao
            </p>
          </div>

          {searchHeader}

          <div className="flex gap-6">
            {filterSidebar}
            <div className="flex-1">{mainContent}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DocumentListLayout;
