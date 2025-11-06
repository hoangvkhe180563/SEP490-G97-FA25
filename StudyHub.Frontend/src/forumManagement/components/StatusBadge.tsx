// StudyHub.Frontend/src/forumManagement/components/StatusBadge.tsx
import { Badge } from "@/common/components/ui/badge";

interface StatusBadgeProps {
  status: boolean | null | string;
  type?: "default" | "appeal" | "report";
}

export const StatusBadge = ({ status, type = "default" }: StatusBadgeProps) => {
  if (type === "appeal") {
    if (status === null)
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
          Đang chờ
        </Badge>
      );
    if (status === true)
      return <Badge className="bg-green-500 text-white">Chấp nhận</Badge>;
    return <Badge className="bg-red-500 text-white">Từ chối</Badge>;
  }

  if (type === "report") {
    if (status === "pending")
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
          Chờ xử lý
        </Badge>
      );
    if (status === "approved")
      return <Badge className="bg-green-500 text-white">Đã duyệt</Badge>;
    return <Badge className="bg-red-500 text-white">Đã từ chối</Badge>;
  }

  return status ? (
    <Badge className="bg-green-500 text-white">Hoạt động</Badge>
  ) : (
    <Badge className="bg-gray-500 text-white">Vô hiệu</Badge>
  );
};
