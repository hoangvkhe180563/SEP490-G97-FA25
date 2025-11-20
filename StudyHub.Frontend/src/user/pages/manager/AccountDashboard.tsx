import React from "react";
import OverviewCard from "@/user/components/OverviewCard";
import AccessBehaviorCard from "@/user/components/AccessBehaviorCard";
import RecoveryCard from "@/user/components/RecoveryCard";
import RealtimeCard from "@/user/components/RealtimeCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

const AccountDashboard: React.FC = () => {
  return (
    <div className="p-4 max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-4">Dashboard tài khoản</h2>

      <div className="space-y-4 mb-6">
        <OverviewCard />
        <AccessBehaviorCard />
      </div>

      <div className="space-y-4 mb-6">
        <RecoveryCard />
        <RealtimeCard />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 text-sm text-slate-500">
              Báo cáo tóm tắt tài khoản. Thay đổi khoảng thời gian xem để cập
              nhật dữ liệu.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountDashboard;
