import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";

const PaymentSuccess: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const enroll = useEnrollmentStore((s) => s.enroll);
  const getEnrollmentForCourse = useEnrollmentStore(
    (s) => s.getEnrollmentForCourse
  );

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rawAmount = search.get("amount");
  const amount = rawAmount ? Number(rawAmount) : undefined;

  const formatVnd = (v?: number) =>
    v
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        }).format(v)
      : undefined;

  // read courseId and txRef from query params
  const rawCourseId = search.get("courseId");
  const txRef = search.get("txRef") ?? search.get("transferNote") ?? undefined;
  const courseId = rawCourseId ? Number(rawCourseId) : undefined;

  useEffect(() => {
    let cancelled = false;

    const doEnroll = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        if (!txRef) {
          setError(
            "Không tìm thấy thông tin giao dịch (txRef). Vui lòng quay lại trang thanh toán."
          );
          setLoading(false);
          return;
        }

        // If an amount param exists, this is a wallet top-up flow.
        // Show receipt with amount and skip course enrollment logic.
        if (amount && Number.isFinite(amount) && amount > 0) {
          setMessage(`Nạp tiền thành công: ${formatVnd(amount)}.`);
          setLoading(false);
          return;
        }

        // if no courseId or no user, just show success receipt
        if (!courseId || !authUser?.id) {
          setMessage(
            "Thanh toán thành công. Bạn có thể trở về trang khóa học."
          );
          setLoading(false);
          return;
        }

        // check if already enrolled locally
        const existing = getEnrollmentForCourse(courseId);
        if (existing) {
          setMessage(
            "Thanh toán thành công. Bạn đã được ghi danh vào khóa học."
          );
          setLoading(false);
          return;
        }

        // attempt enrollment
        try {
          await enroll({ appUserId: String(authUser.id), courseId });
          if (cancelled) return;
          setMessage("Bạn đã được ghi danh thành công. Chúc bạn học vui vẻ!");
          setLoading(false);
        } catch (err: any) {
          console.error("enroll error", err);
          // if enrollment fails, still show payment success but give fallback
          setError(
            "Thanh toán đã thành công nhưng ghi danh tự động thất bại. Vui lòng vào trang khóa học để đăng ký thủ công hoặc liên hệ hỗ trợ."
          );
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doEnroll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txRef, courseId, authUser?.id]);

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
                <Button
                  onClick={() =>
                    navigate(`/course/student/courses/${courseId}`)
                  }
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Về khóa học
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(-1)}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Quay lại
                </Button>
              )}

              <Button variant="outline" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              Nếu bạn đã thanh toán nhưng chưa được ghi danh trong vài phút, vui
              lòng liên hệ bộ phận hỗ trợ.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
