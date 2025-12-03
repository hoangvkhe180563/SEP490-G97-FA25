import React from "react";
import { Button } from "@/common/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ForbiddenProps = {
  roles?: string[];
  onCopyRoles?: () => Promise<void>;
  onBack?: () => void;
};

const Forbidden: React.FC<ForbiddenProps> = ({ roles = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-xl">
        <h1 className="text-7xl font-bold">403</h1>
        <div className="my-4 p-6 rounded-full bg-gray-100 dark:bg-gray-800 inline-flex items-center justify-center">
          <Lock className="w-14 h-14 text-gray-700 dark:text-gray-200" />
        </div>
        <h2 className="text-3xl font-semibold mt-2">Không có quyền truy cập</h2>
        <p className="text-lg mt-2 text-gray-600 dark:text-gray-400">
          Bạn không có quyền để vào trang này.
        </p>

        {roles && roles.length > 0 && (
          <p className="text-sm mt-2 text-gray-500">
            Vai trò hiện tại: {roles.join(", ")}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button onClick={() => navigate("/")}>Về trang chủ</Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
