// src/documentManagement/components/documents/DocumentListLayout.tsx
import type { ReactNode } from "react";

interface DocumentListLayoutProps {
  searchHeader: ReactNode;
  filterSidebar: ReactNode;
  mainContent: ReactNode;
}

// src/documentManagement/components/documents/DocumentListLayout.tsx
const DocumentListLayout = ({
  searchHeader,
  filterSidebar,
  mainContent,
}: DocumentListLayoutProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 py-4 bg-white border-b">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            📚 Thư viện tài liệu
          </h1>
          <p className="text-sm text-gray-600">
            Khám phá và tải xuống tài liệu học tập chất lượng cao
          </p>
        </div>
        {searchHeader}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto bg-gray-50 border-r">
          <div className="p-4">{filterSidebar}</div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6">{mainContent}</div>
        </main>
      </div>
    </div>
  );
};

export default DocumentListLayout;
