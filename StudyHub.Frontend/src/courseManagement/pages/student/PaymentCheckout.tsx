import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { usePaymentStore } from "@/courseManagement/stores/usePaymentStore";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import { AppDialog } from "@/courseManagement/components/AppDialog";

const PaymentCheckout: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });

  const rawPrice = search.get("price") ?? "0";
  const price = Number(rawPrice || 0);
  const name = search.get("name")
    ? decodeURIComponent(search.get("name")!)
    : "Khóa học";
  const schoolId = search.get("schoolId") ?? "";
  const courseId = search.get("courseId") ?? "";

  const authUser = useAuthStore((s) => s.user);
  const loading = usePaymentStore((s) => s.loading);
  const result = usePaymentStore((s) => s.result);
  const error = usePaymentStore((s) => s.error);
  const fetchPaymentInfo = usePaymentStore((s) => s.fetchPaymentInfo);

  const orderRef = useMemo(() => {
    return `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
      Math.random() * 900 + 100
    )}`;
  }, []);

  useEffect(() => {
    const transferNote = `CH${authUser?.transferId ?? ""}`;
    fetchPaymentInfo(schoolId || "0", price, orderRef, transferNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, price, orderRef, name, authUser?.id]);

  // Auto-poll payment status: when backend marks txRef as Paid, navigate to success
  useEffect(() => {
    let timer: any = null;
    let cancelled = false;

    const startPolling = () => {
      if (!result?.transferNote) return;
      // poll every 5s
      timer = setInterval(async () => {
        try {
          const status = await usePaymentStore
            .getState()
            .checkStatus(result.transferNote as string);
          if (status === "Paid") {
            if (cancelled) return;
            // stop polling and navigate to success (same behavior as manual button)
            clearInterval(timer);
            const params = new URLSearchParams();
            if (courseId) params.set("courseId", courseId);
            if (result?.transferNote) params.set("txRef", result.transferNote);
            navigate(`/course/student/payment-success?${params.toString()}`);
          }
        } catch (err) {
          // ignore transient errors
        }
      }, 5000);
    };

    startPolling();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
    // only re-run when transferNote or courseId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.transferNote, courseId]);

  const copyText = (t: string) => navigator.clipboard?.writeText(t);

  /** 🖼️ Copy QR image vào clipboard (với AppDialog hiển thị kết quả) */
  const copyImage = async (imageUrl: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();

      if (!("clipboard" in navigator) || !("write" in navigator.clipboard)) {
        setDialog({
          open: true,
          title: "Không hỗ trợ",
          message:
            "Trình duyệt của bạn không hỗ trợ sao chép ảnh trực tiếp. Vui lòng tải ảnh thủ công.",
        });
        return;
      }

      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);

      setDialog({
        open: true,
        title: "Thành công",
        message:
          "Ảnh QR đã được sao chép vào clipboard. Bạn có thể dán vào Zalo, Messenger, v.v.",
      });
    } catch (err) {
      console.error(err);
      setDialog({
        open: true,
        title: "Lỗi",
        message: "Không thể sao chép ảnh. Vui lòng thử lại.",
      });
    }
  };

  // When user clicks "I have paid", check transaction status from backend and redirect if paid

  return (
    <>
      {/* AppDialog hiển thị thông báo */}
      <AppDialog dialog={dialog} setDialog={setDialog} />

      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-sky-50 to-white p-6">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          {/* LEFT: Payment Info */}
          <div className="flex-1 p-8">
            <h1 className="text-3xl font-semibold mb-2 text-gray-800">
              Thanh toán khóa học
            </h1>
            <p className="text-gray-500 mb-6">{name}</p>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-gray-500 text-sm">Số tiền</span>
              <span className="text-4xl font-extrabold text-sky-700">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(price)}
              </span>
            </div>

            <div className="text-gray-600 mb-6">
              Mã đơn hàng:{" "}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                {orderRef}
              </span>
              <button
                onClick={() => copyText(orderRef)}
                className="ml-2 text-xs text-sky-600 hover:underline"
              >
                Sao chép
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                ⏳ Đang tạo đơn và lấy mã QR…
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                ❌ Lỗi: {error}
              </div>
            ) : result ? (
              <div className="space-y-5">
                {result.accountNumber && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Số tài khoản
                    </div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.accountNumber}
                    </div>
                    {result.accountName && (
                      <div className="text-sm text-gray-600">
                        {result.accountName}
                      </div>
                    )}

                    {result.transferNote && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Nội dung chuyển khoản
                        </div>
                        <div className="font-mono bg-white px-3 py-2 rounded border text-sm break-all">
                          {result.transferNote}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-6">
                  {result.qrUrl && (
                    <Button
                      onClick={() => copyImage(result.qrUrl)}
                      className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-6 py-2 text-sm"
                    >
                      📋 Copy image
                    </Button>
                  )}

                  <Button
                    onClick={() => navigate(-1)}
                    variant="ghost"
                    className="border rounded-xl px-6 py-2 text-sm"
                  >
                    Quay lại
                  </Button>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed mt-4">
                  💡 Quét mã QR bằng ứng dụng ngân hàng hoặc SePay để thanh
                  toán. Sau khi hoàn tất, hệ thống sẽ tự động cập nhật trạng
                  thái thanh toán (webhook xử lý tự động).
                </p>
              </div>
            ) : null}
          </div>

          {/* RIGHT: QR Code */}
          <div className="w-full md:w-80 bg-gray-50 border-l border-gray-100 p-8 flex flex-col items-center justify-center">
            <div className="bg-white rounded-2xl border shadow-sm p-4 w-64 h-64 flex items-center justify-center">
              {loading ? (
                <div className="text-gray-400 text-sm">Đang tải QR…</div>
              ) : result?.qrUrl ? (
                <img
                  src={result.qrUrl}
                  alt="QR Payment"
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="text-gray-400 text-sm">Không có QR</div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Quét mã để thanh toán
            </div>
          </div>
        </div>
      </div>
      <AppDialog dialog={dialog} setDialog={setDialog} />
    </>
  );
};

export default PaymentCheckout;
