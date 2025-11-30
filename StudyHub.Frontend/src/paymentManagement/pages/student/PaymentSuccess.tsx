import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import { useSubscriptionStore } from "@/paymentManagement/stores/useSubscriptionStore";

const PaymentSuccess: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const enroll = useEnrollmentStore((s) => s.enroll);
  const getEnrollmentForCourse = useEnrollmentStore(
    (s) => s.getEnrollmentForCourse
  );
  const subscribe = useSubscriptionStore((s) => s.subscribe);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const price = search.get("price") ? Number(search.get("price")) : undefined;
  const walletUsed = search.get("walletUsed")
    ? Number(search.get("walletUsed"))
    : undefined;

  const isSubscription = search.get("subscription") === "1";
  const months = search.get("months")
    ? Number(search.get("months"))
    : undefined;
  const packageName = search.get("packageName") ?? undefined;
  const txRef = search.get("txRef") ?? search.get("transferNote") ?? undefined;
  const courseId = search.get("courseId")
    ? Number(search.get("courseId"))
    : undefined;

  const formatVnd = (v?: number) =>
    v
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(v)
      : undefined;

  // read courseId and txRef from query params

  useEffect(() => {
    let cancelled = false;

    const handlePaymentSuccess = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        // 1️⃣ Kiểm tra giao dịch hợp lệ
        if (!txRef) {
          throw new Error(
            "Không tìm thấy thông tin giao dịch. Vui lòng quay lại trang thanh toán."
          );
        }

        // 2️⃣ Trường hợp nạp ví
        if (price && Number.isFinite(price) && price > 0) {
          setMessage(`Nạp tiền thành công: ${formatVnd(price)}.`);
        }

        // 3️⃣ Trường hợp đăng ký gói subscription
        if (isSubscription) {
          try {
            const req: any = {
              packageName,
              months: months ?? 1,
              price: price ?? 0,
            };
            // include walletUsed if present so backend can deduct wallet amount
            if (walletUsed && walletUsed > 0) req.walletUsed = walletUsed;
            const resp = await subscribe(req as any);
            if (!resp) {
              throw new Error(
                "Không lưu được đăng ký. Vui lòng thử lại hoặc liên hệ hỗ trợ."
              );
            }

            setMessage(
              `Đăng ký thành công. Gói: ${packageName ?? ""} (${
                months ?? 1
              } tháng).`
            );
            return;
          } catch (err: any) {
            throw new Error(err?.message ?? "Lỗi khi lưu thông tin đăng ký.");
          }
        }

        // 4️⃣ Trường hợp thanh toán khóa học
        if (!courseId || !authUser?.id) {
          setMessage(
            "Thanh toán thành công. Bạn có thể trở về trang khóa học."
          );
          return;
        }

        // Kiểm tra ghi danh hiện có
        const existing = getEnrollmentForCourse(courseId);
        if (existing) {
          setMessage(
            "Thanh toán thành công. Bạn đã được ghi danh vào khóa học."
          );
          return;
        }

        // Thực hiện ghi danh
        await enroll({ appUserId: String(authUser.id), courseId });
        if (!cancelled) {
          setMessage("Bạn đã được ghi danh thành công. Chúc bạn học vui vẻ!");
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    handlePaymentSuccess();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txRef, courseId, authUser?.id, price]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-emerald-700">
            Thanh toán thành công
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Cảm ơn bạn đã thanh toán. Mã giao dịch:{" "}
            <span className="font-mono">{txRef}</span>
          </p>
        </div>

        {loading ? (
          <div className="text-gray-500 py-8">⏳ Đang xử lý...</div>
        ) : (
          <div>
            {message && <div className="text-emerald-700 mb-4">{message}</div>}
            {error && <div className="text-red-600 mb-4">{error}</div>}
            <div className="flex justify-center gap-3 mt-6">
              {courseId ? (
                // Nếu có courseId → về trang khóa học
                <Button
                  onClick={() =>
                    navigate(`/course/student/courses/${courseId}`)
                  }
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Về trang khóa học
                </Button>
              ) : isSubscription ? (
                // Nếu là subscription → về trang hỏi đáp
                <Button
                  onClick={() => navigate("/qa/student/conversations")}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Về trang hỏi đáp
                </Button>
              ) : (
                // Ngược lại → về trang nạp tiền
                <Button
                  onClick={() => navigate("/payment/student/wallet-topup")}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Về trang nạp tiền
                </Button>
              )}

              <Button variant="outline" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              Nếu bạn đã thanh toán nhưng chưa được xử lý trong vài phút, vui
              lòng liên hệ bộ phận hỗ trợ.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
