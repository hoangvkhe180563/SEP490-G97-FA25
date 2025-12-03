import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@/common/components/ui/table";
import { Button } from "@/common/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

type Props = {
  topics: any[];
  onEdit: (topic: any) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
};

const TopicTable: React.FC<Props> = ({
  topics = [],
  onEdit,
  onDelete,
  isDeleting,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="px-3 py-2 text-left min-w-[220px]">
              Tên
            </TableHead>
            <TableHead className="px-3 py-2 text-left min-w-[160px]">
              Môn
            </TableHead>
            <TableHead className="px-3 py-2 text-right min-w-[120px]">
              Trạng thái
            </TableHead>
            <TableHead className="px-3 py-2 text-right min-w-[120px]">
              Hành động
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((t: any) => (
            <TableRow key={t.id}>
              <TableCell className="px-3 py-2 max-w-xs truncate">
                {t.name}
              </TableCell>
              <TableCell className="px-3 py-2 max-w-xs truncate">
                {t.subjectName ?? t.subject?.name ?? "-"}
              </TableCell>
              <TableCell className="px-3 py-2 text-right">
                {t.isActive ? "Hoạt động" : "Đã ẩn"}
              </TableCell>
              <TableCell className="px-3 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {t.isActive && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(Number(t.id))}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TopicTable;
