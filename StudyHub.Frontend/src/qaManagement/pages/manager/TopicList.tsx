import React, { useEffect, useState } from "react";
import useTopicStore from "../../stores/useTopicStore";
import TopicFilters from "../../components/TopicFilters";
import TopicTable from "../../components/TopicTable";
import TopicFormModal from "../../components/TopicFormModal";
import { Card } from "@/common/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/common/components/ui/alert-dialog";

const TopicList: React.FC = () => {
  const { topics, searchTopics, deleteTopic, isDeleting } = useTopicStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    searchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (t: any) => {
    setEditing(t);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    // open confirmation dialog
    setConfirmId(id);
  };

  const [confirmId, setConfirmId] = useState<number | null>(null);

  const confirmDelete = async () => {
    if (!confirmId) return;
    await deleteTopic(confirmId);
    setConfirmId(null);
  };

  const handleSearch = (q?: string, subjectId?: number) => {
    if (!q && !subjectId) {
      searchTopics();
      return;
    }
    // call store search
    useTopicStore.getState().searchTopics(q, subjectId);
  };

  return (
    <div className="space-y-4 max-h-screen overflow-auto px-4 md:px-8">
      <Card className="p-4">
        <TopicFilters onAdd={handleAdd} onSearch={handleSearch} />
      </Card>

      <Card className="p-4">
        <TopicTable
          topics={topics ?? []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      </Card>

      <TopicFormModal
        open={modalOpen}
        setOpen={setModalOpen}
        initial={editing}
      />
      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ẩn topic?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ ẩn topic khỏi danh sách hiển thị. Bạn có chắc
              chắn muốn tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TopicList;
