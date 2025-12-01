import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStore } from "@/paymentManagement/stores/useSubscriptionStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/common/components/ui/card";
import { Checkbox } from "@/common/components/ui/checkbox";

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const [months, setMonths] = useState<number>(1);
  const [useWallet, setUseWallet] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const packageName = "QA-Monthly";
  const pricePerMonth = 100000;

  const onSubscribe = async () => {
    setError(null);
    if (!authUser) {
      navigate("/login");
      return;
    }
    const total = pricePerMonth * Math.max(1, months);
    try {
      const walletBalance = Number(authUser?.wallet ?? 0);
      const walletToUse = useWallet ? Math.min(walletBalance, total) : 0;
      const remaining = Math.max(0, total - walletToUse);

      // If wallet covers full amount -> go directly to success flow (price=0) and indicate walletUsed
      const tn = `SUB${authUser?.id ?? ""}-${Date.now().toString().slice(-6)}`;
      if (walletToUse >= total) {
        const params = new URLSearchParams({
          price: String(0),
          packageName: `${packageName} (${months} tháng)`,
          subscription: "1",
          months: String(months),
          txRef: tn,
          walletUsed: String(total),
        });
        // PaymentSuccess will call subscribe() with price=0 and walletUsed so backend can deduct wallet
        navigate(`/payment/student/payment-success?${params.toString()}`);
        return;
      }

      // Otherwise, use wallet partially and navigate to checkout for remaining amount
      const params = new URLSearchParams({
        price: String(remaining),
        packageName: `${packageName} (${months} tháng)`,
        subscription: "1",
        months: String(months),
        walletUsed: String(walletToUse),
        schoolId: String(authUser?.schoolId ?? "0"),
      });

      navigate(`/payment/student/checkout?${params.toString()}`);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 h-full overflow-y-auto scrollbar-hide">
      <Card className="shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-center py-8">
          <CardTitle className="text-3xl font-bold">
            Gói QA với Giáo viên
          </CardTitle>
          <p className="text-base opacity-90 mt-2">
            Học hỏi trực tiếp với giáo viên & nhận phản hồi chi tiết
          </p>
        </CardHeader>

        <CardContent className="p-8">
          <div className="space-y-5">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-600 font-medium">Gói:</span>
              <span className="font-semibold text-gray-800">{packageName}</span>
            </div>

            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-600 font-medium">Giá mỗi tháng:</span>
              <span className="font-semibold text-indigo-600">
                {pricePerMonth.toLocaleString("vi-VN")} VND
              </span>
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Số tháng:
              </label>
              <input
                type="number"
                value={months}
                min={1}
                onChange={(e) => setMonths(Number(e.target.value) || 1)}
                className="w-32 border border-gray-300 px-3 py-2 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                checked={useWallet}
                onCheckedChange={(v) => setUseWallet(Boolean(v))}
              />
              <label className="text-gray-700">
                Sử dụng số dư ví{" "}
                <span className="font-semibold text-indigo-600">
                  ({Number(authUser?.wallet ?? 0).toLocaleString("vi-VN")} VND)
                </span>
              </label>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mt-2">
                {error}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-3 bg-gray-50 py-6">
          <Button
            size="lg"
            className="w-64 text-lg py-6 font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
            onClick={onSubscribe}
            disabled={isLoading}
          >
            {isLoading
              ? "Đang xử lý..."
              : `Mua ngay • ${(pricePerMonth * months).toLocaleString(
                  "vi-VN"
                )} VND`}
          </Button>

          <p className="text-gray-500 text-sm">
            Thanh toán an toàn • Kích hoạt tự động sau khi xác nhận
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubscriptionPage;
