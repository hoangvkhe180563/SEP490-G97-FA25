// src/documentManagement/components/DocumentDashboardFilter.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";

interface DocumentDashboardFilterProps {
  onFilter: (schoolId?: number) => void;
  isLoading: boolean;
}

const DocumentDashboardFilter: React.FC<DocumentDashboardFilterProps> = ({
  onFilter,
  isLoading,
}) => {
  const [schoolId, setSchoolId] = useState<string>("");

  const handleApply = () => {
    if (schoolId.trim() === "") {
      onFilter(undefined);
    } else {
      const id = parseInt(schoolId);
      if (!isNaN(id)) {
        onFilter(id);
      }
    }
  };

  const handleReset = () => {
    setSchoolId("");
    onFilter(undefined);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bộ lọc</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="schoolId">Mã trường (để trống để xem tất cả)</Label>
            <Input
              id="schoolId"
              type="number"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              placeholder="Nhập mã trường"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleApply}
            disabled={isLoading}
            className="bg-sky-600 hover:bg-sky-700"
          >
            Áp dụng
          </Button>
          <Button onClick={handleReset} disabled={isLoading} variant="outline">
            Đặt lại
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentDashboardFilter;
