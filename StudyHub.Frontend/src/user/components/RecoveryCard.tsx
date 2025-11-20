import React, { useEffect } from "react";
import useAccountDashboardStore from "@/user/stores/useAccountDashboardStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/common/components/ui/card";

const RecoveryCard: React.FC = () => {
  const recovery = useAccountDashboardStore((s) => s.recovery);
  const isLoading = useAccountDashboardStore((s) => s.isLoading);
  const fetchRecovery = useAccountDashboardStore((s) => s.fetchRecoveryStats);

  useEffect(() => {
    fetchRecovery().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Thống kê yêu cầu khôi phục tài khoản</CardTitle>
        <CardDescription>
          Yêu cầu khôi phục, tỉ lệ, thời gian xử lý
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-40 bg-gray-100" />
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-sm text-slate-500">Tổng số yêu cầu</div>
              <div className="text-2xl font-semibold">
                {recovery?.totalRequests ?? "—"}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Phê duyệt:{" "}
                <span className="font-medium">
                  {recovery?.approvedCount ?? "—"}
                </span>{" "}
                (
                {typeof recovery?.approvedRate === "number"
                  ? `${recovery.approvedRate.toFixed(2)}%`
                  : "—"}
                )
              </div>
              <div className="text-sm">
                Từ chối:{" "}
                <span className="font-medium">
                  {recovery?.rejectedCount ?? "—"}
                </span>{" "}
                (
                {typeof recovery?.rejectedRate === "number"
                  ? `${recovery.rejectedRate.toFixed(2)}%`
                  : "—"}
                )
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Thời gian xử lý trung bình:{" "}
              {typeof recovery?.averageResolveMinutes === "number"
                ? `${recovery.averageResolveMinutes.toFixed(1)} phút`
                : "—"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecoveryCard;
