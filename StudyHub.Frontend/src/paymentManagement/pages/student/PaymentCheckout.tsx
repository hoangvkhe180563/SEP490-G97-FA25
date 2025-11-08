import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { usePaymentStore } from "@/paymentManagement/stores/usePaymentStore";
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
  // const startPaymentConnection = usePaymentStore(
  //   (s) => s.startPaymentConnection
  // );
  // const stopPaymentConnection = usePaymentStore((s) => s.stopPaymentConnection);

  const orderRef = useMemo(() => {
    return `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
      Math.random() * 900 + 100
    )}`;
  }, []);

  // --- STEP 1: Fetch payment info on mount ---
  useEffect(() => {
    const transferNote = `CH${authUser?.transferId ?? ""}${courseId}`;
    fetchPaymentInfo(schoolId || "0", price, orderRef, transferNote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, price, orderRef, name, authUser?.id]);

  // --- STEP 2: Redirect to fail page if error ---
  useEffect(() => {
    if (error) {
      const params = new URLSearchParams();
      params.set("msg", encodeURIComponent(String(error)));
      params.set("orderRef", orderRef);
      params.set("price", String(price));
      if (name) params.set("name", encodeURIComponent(name));
      if (schoolId) params.set("schoolId", schoolId);
      if (courseId) params.set("courseId", courseId);
      navigate(`/payment/student/payment-failed?${params.toString()}`);
    }
  }, [error, navigate, orderRef, price, name, schoolId, courseId]);

  // useEffect(() => {
  //   let active = true;

  //   const initPaymentConnection = async () => {
  //     try {
  //       if (active) {
  //         await startPaymentConnection();
  //         console.info("✅ PaymentHub connected");
  //       }
  //     } catch (err) {
  //       if (active) {
  //         console.error("❌ PaymentHub connection failed:", err);
  //       }
  //     }
  //   };

  //   initPaymentConnection();

  //   return () => {
  //     active = false;
  //     console.info("🧹 Stopping PaymentHub connection");
  //     stopPaymentConnection();
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    try {
      const notification = result?.paymentNotification;
      console.log("PaymentReceived notification:", notification);
      if (!notification) return;

      if (Number(courseId) != notification.courseId) return;
      console.log("Payment notification matches current courseId:", courseId);

      const params = new URLSearchParams();
      if (courseId) params.set("courseId", courseId);
      params.set("txRef", notification.reference || "");
      navigate(`/payment/student/payment-success?${params.toString()}`);
    } catch (err) {
      console.error("PaymentReceived handler error:", err);
    }
    // only re-run when a notification arrives for current result
  }, [result?.paymentNotification, courseId, navigate]);

  const copyText = (t: string) => navigator.clipboard?.writeText(t);

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

  // --- RENDER ---
  return (
    <>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyText(orderRef)}
                className="ml-2 text-xs text-sky-600 hover:underline p-0"
              >
                Sao chép
              </Button>
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
    </>
  );
};

export default PaymentCheckout;
