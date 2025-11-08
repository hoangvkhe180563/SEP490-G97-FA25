import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { usePaymentStore } from "@/paymentManagement/stores/usePaymentStore";
import { paymentService } from "@/paymentManagement/services/paymentService";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Image as ImageIcon, ArrowLeft, CreditCard } from "lucide-react";

// Hàm chuyển số sang chữ tiếng Việt cơ bản
const numberToWords = (num: number): string => {
  if (isNaN(num) || num <= 0) return "";
  const units = ["", "nghìn", "triệu", "tỷ"];
  const digits = [
    "không",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];

  const readThree = (n: number) => {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;
    let str = "";

    if (hundred > 0) {
      str += digits[hundred] + " trăm";
      if (ten === 0 && one !== 0) str += " lẻ";
    }

    if (ten > 1) {
      str += " " + digits[ten] + " mươi";
      if (one === 1) str += " mốt";
      else if (one === 5) str += " lăm";
      else if (one > 0) str += " " + digits[one];
    } else if (ten === 1) {
      str += " mười";
      if (one === 1) str += " một";
      else if (one === 5) str += " lăm";
      else if (one > 0) str += " " + digits[one];
    } else if (ten === 0 && one > 0) {
      str += " " + digits[one];
    }
    return str.trim();
  };

  let result = "";
  let i = 0;
  while (num > 0) {
    const group = num % 1000;
    if (group > 0) {
      result = readThree(group) + " " + units[i] + " " + result;
    }
    num = Math.floor(num / 1000);
    i++;
  }

  result = result.replace(/\s+/g, " ").trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
};

const WalletTopUp: React.FC = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });

  const [amount, setAmount] = useState<number>(0);
  const [amountText, setAmountText] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [transferNote, setTransferNote] = useState<string | null>(null);
  const [number, setNumber] = useState<number | null>(null);
  const result = usePaymentStore((s) => s.result);
  const fetchPaymentInfo = usePaymentStore((s) => s.fetchPaymentInfo);

  useEffect(() => {
    (async () => {
      try {
        if (!authUser?.schoolId) return;
        const info = await paymentService.getPaymentInfo(authUser.schoolId);
        setAccountNumber(info.accountNumber ?? null);
        setAccountName(info.accountName ?? null);
      } catch {
        // ignore
      }
    })();
  }, [authUser?.schoolId]);

  const formatVnd = (v: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(v);

  // Gợi ý động kiểu ngân hàng
  const suggestedAmounts = useMemo(() => {
    if (!amount || amount <= 0) return [10000, 20000, 50000, 100000, 200000];
    const val = Math.floor(amount);
    const multiples = [10, 100, 1000, 10000, 100000];
    const g = multiples.map((factor) => val * factor);
    return g.filter((v) => v <= 100_000_000);
  }, [amount]);

  const handleAmountChange = (val: string) => {
    const n = Number(val);
    if (isNaN(n) || n <= 0) {
      setAmount(0);
      setAmountText("");
      return;
    }
    setAmount(n);
    setAmountText(numberToWords(n));
  };

  const generateQr = async () => {
    if (!authUser?.id) {
      navigate("/auth/login");
      return;
    }
    if (!amount || amount <= 0) {
      setDialog({
        open: true,
        title: "Lỗi",
        message: "Vui lòng nhập số tiền hợp lệ.",
      });
      return;
    }

    try {
      // get payment info for display
      const info = await paymentService.getPaymentInfo(authUser.schoolId);

      const random3 = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");

      setNumber(Number(random3));

      const tn = `CH${authUser?.transferId ?? ""}${random3}`;

      // generate an orderRef for the top-up so the store can track it
      const orderRef = `ORD-TOPUP-${Date.now()
        .toString()
        .slice(-6)}-${random3}`;

      // populate the global payment store (so result won't be null, matching PaymentCheckout)
      await fetchPaymentInfo(authUser.schoolId, amount, orderRef, tn);

      // locally build the same QR url for immediate UI update (store also contains qrUrl)
      const url = paymentService.buildSepayQrUrl({
        amount,
        accountNumber: info.accountNumber,
        bank: info.accountBank,
        description: tn,
      });

      // ✅ cập nhật local state
      setAccountNumber(info.accountNumber ?? null);
      setAccountName(info.accountName ?? null);
      setQrUrl(url);
      setTransferNote(tn);
    } catch (err: any) {
      setDialog({
        open: true,
        title: "Lỗi",
        message: err?.message ?? String(err),
      });
    }
  };

  useEffect(() => {
    try {
      const notification = result?.paymentNotification;
      console.log(
        "Payment notification received in WalletTopUp:",
        notification
      );
      if (!notification) return;
      console.log(number);

      if (number != notification.courseId) return;

      const params = new URLSearchParams();
      params.set("amount", String(amount));
      if ((notification as any).reference)
        params.set("txRef", (notification as any).reference);
      navigate(`/payment/student/payment-success?${params.toString()}`);
    } catch (err) {
      console.error("WalletTopUp PaymentReceived handler error:", err);
    }
  }, [result, number, amount, navigate]);

  const copyText = (t: string) => navigator.clipboard?.writeText(t);

  const copyImage = async (imageUrl: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      setDialog({
        open: true,
        title: "✅ Đã sao chép",
        message: "Ảnh mã QR đã được lưu vào clipboard.",
      });
    } catch {
      setDialog({
        open: true,
        title: "Lỗi",
        message: "Không thể sao chép ảnh.",
      });
    }
  };
  return (
    <>
      <AppDialog dialog={dialog as any} setDialog={(d: any) => setDialog(d)} />

      <div className="h-full bg-gradient-to-br from-sky-100 via-blue-50 to-white overflow-y-auto ">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full mx-auto max-w-5xl bg-white rounded-3xl shadow-[0_0_40px_-10px_rgba(56,189,248,0.4)] border border-sky-100 p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <CreditCard className="text-sky-600 w-8 h-8 drop-shadow-sm" />
            <h2 className="text-4xl font-bold text-gray-800">
              Nạp tiền vào ví học tập
            </h2>
          </div>
          <p className="text-gray-600 text-lg mb-8">
            Chọn số tiền bạn muốn nạp và quét mã QR để thanh toán nhanh chóng,
            an toàn.
          </p>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2">
              <Label className="text-base font-semibold text-gray-700">
                Số tiền (VND)
              </Label>
              <Input
                type="number"
                min={1000}
                value={amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full border-2 border-sky-100 rounded-2xl px-5 py-4 mt-2 text-lg focus:outline-none focus:ring-4 focus:ring-sky-300"
              />

              {amountText && (
                <p className="text-gray-500 text-sm italic mt-2">
                  {amountText}
                </p>
              )}

              <motion.div layout className="flex flex-wrap gap-3 mt-4">
                {suggestedAmounts.map((v) => (
                  <Button
                    key={v}
                    variant={v === amount ? "default" : "outline"}
                    onClick={() => {
                      setAmount(v);
                      setAmountText(numberToWords(v));
                    }}
                    className={`rounded-xl text-base px-5 py-3 transition-all ${
                      v === amount
                        ? "bg-sky-600 text-white shadow-lg scale-105"
                        : "hover:bg-sky-50"
                    }`}
                  >
                    {formatVnd(v)}
                  </Button>
                ))}
              </motion.div>
            </div>

            <div className="bg-gradient-to-br from-sky-50 to-white rounded-2xl p-6 border border-sky-100 shadow-inner">
              <Label className="text-base font-semibold text-gray-700">
                Tài khoản nhận
              </Label>
              <div className="mt-3 text-lg">
                <div className="font-semibold text-gray-800">
                  {accountName ?? "—"}
                </div>
                <div className="text-gray-500">{accountNumber ?? "—"}</div>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="flex gap-4 mb-10">
            <Button
              onClick={generateQr}
              className="bg-sky-600 text-white text-lg px-6 py-3 rounded-xl shadow hover:shadow-lg transition"
            >
              ⚡ Tạo mã QR
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-lg"
            >
              <ArrowLeft className="mr-2 w-5 h-5" /> Quay lại
            </Button>
          </div>

          {/* QR */}
          <AnimatePresence>
            {qrUrl && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
              >
                <div className="bg-white border border-sky-100 rounded-3xl shadow-xl p-6 text-center">
                  <div className="text-base text-gray-500 mb-3">
                    Quét mã để thanh toán
                  </div>
                  <img
                    src={qrUrl}
                    alt="QR"
                    className="w-72 h-72 mx-auto object-contain rounded-2xl border border-gray-100"
                  />
                  <div className="mt-5 flex justify-center gap-3">
                    <Button
                      onClick={() => copyImage(qrUrl!)}
                      className="bg-sky-600 text-white text-base px-5 py-2 rounded-xl"
                    >
                      <ImageIcon className="w-5 h-5 mr-1" /> Copy ảnh
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-inner">
                  <div className="text-base text-gray-600 mb-2">
                    Nội dung chuyển khoản
                  </div>
                  <div className="font-mono bg-white border border-gray-200 p-4 rounded-xl mt-2 break-words text-sky-700 font-semibold text-lg tracking-wide">
                    {transferNote}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      onClick={() => transferNote && copyText(transferNote)}
                      className="bg-sky-600 text-white text-base px-5 py-2 rounded-xl"
                    >
                      <Copy className="w-5 h-5 mr-1" /> Copy nội dung
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigator.clipboard?.writeText(String(amount))
                      }
                      className="text-base px-5 py-2 rounded-xl"
                    >
                      Copy số tiền
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 mt-5 leading-relaxed">
                    💡 Sau khi chuyển khoản, hệ thống sẽ tự động nhận diện và
                    cộng tiền vào ví trong vài phút. Bạn có thể tiếp tục học
                    ngay sau khi nạp xong.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default WalletTopUp;
