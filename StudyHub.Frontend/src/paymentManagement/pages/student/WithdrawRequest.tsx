import React, { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/common/components/ui/tooltip";
import { HelpCircle, UploadCloud, X } from "lucide-react";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useTransactionStore } from "@/paymentManagement/stores/useTransactionStore";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import { AppDialog } from "@/courseManagement/components/AppDialog";

// ===== Hàm chuyển số thành chữ (VNĐ) =====
const numberToVietnamese = (num: number): string => {
  if (!num || isNaN(num)) return "";
  const dv = [
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
  const ch = ["", "nghìn", "triệu", "tỷ"];
  const readGroup = (n: number) => {
    const tr = Math.floor(n / 100);
    const chuc = Math.floor((n % 100) / 10);
    const dvn = n % 10;
    let s = "";
    if (tr > 0) {
      s += dv[tr] + " trăm";
      if (chuc === 0 && dvn > 0) s += " linh";
    }
    if (chuc > 1) {
      s += " " + dv[chuc] + " mươi";
      if (dvn === 1) s += " mốt";
      else if (dvn === 5) s += " lăm";
      else if (dvn > 1) s += " " + dv[dvn];
    } else if (chuc === 1) {
      s += " mười";
      if (dvn === 5) s += " lăm";
      else if (dvn > 0) s += " " + dv[dvn];
    } else if (chuc === 0 && dvn > 0 && tr === 0) s += dv[dvn];
    return s.trim();
  };

  let i = 0;
  let result = "";
  while (num > 0) {
    const n = num % 1000;
    if (n !== 0) {
      const group = readGroup(n);
      result = group + " " + ch[i] + " " + result;
    }
    num = Math.floor(num / 1000);
    i++;
  }
  return (result.trim() + " đồng").replace(/\s+/g, " ");
};

const WithdrawRequest: React.FC = () => {
  const auth = useAuthStore((s) => s.user);
  const requestWithdraw = useTransactionStore((s) => s.requestWithdraw);
  const uploadProof = useTransactionStore((s) => s.uploadProof);

  const [amount, setAmount] = useState<number>(0);
  const [amountText, setAmountText] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [description, setDescription] = useState("Rút tiền về tài khoản");
  const [result, setResult] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [method, setMethod] = useState<"manual" | "upload">("manual");
  const [uploading, setUploading] = useState(false);
  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ===== Gợi ý số tiền động (kiểu ngân hàng) =====
  const suggestedAmounts = useMemo(() => {
    if (!amount || amount <= 0) return [10000, 20000, 50000, 100000, 200000];

    const val = Math.floor(Number(amount));
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
    setAmountText(numberToVietnamese(n));
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setResult("Kích thước ảnh quá lớn (tối đa 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(f);

    try {
      setUploading(true);
      const url = await uploadProof(f);
      if (url) {
        setUploadedUrl(url);
        setDialog({
          open: true,
          title: "Tải ảnh thành công",
          message: "Ảnh bằng chứng đã được tải lên máy chủ.",
        });
      } else throw new Error("Không thể tải ảnh lên máy chủ");
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setDialog({ open: true, title: "Lỗi", message: msg });
      setResult(msg);
    } finally {
      setUploading(false);
    }
  };

  const clearUpload = () => {
    setUploadPreview(null);
    setUploadedUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!auth) return setResult("Bạn phải đăng nhập để thực hiện yêu cầu");
    const amt = typeof amount === "string" ? Number(amount) : amount;
    if (!amt || amt <= 0) return setResult("Vui lòng nhập số tiền hợp lệ");

    const req = {
      userId: auth.id,
      amount: Math.floor(amt),
      type: "Withdraw",
      accountNumber,
      description,
      qrcodeUrl: uploadedUrl ?? uploadPreview ?? null,
    } as any;

    try {
      const tx = await requestWithdraw(req);
      if (tx) {
        setDialog({
          open: true,
          title: "Yêu cầu gửi thành công",
          message: `Yêu cầu rút ${tx.amount.toLocaleString(
            "vi-VN"
          )}đ đã được gửi. Trạng thái: ${tx.status}`,
        });
        setResult("Yêu cầu đã gửi. Trạng thái: " + tx.status);
      } else throw new Error("Yêu cầu thất bại, vui lòng thử lại");
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setDialog({ open: true, title: "Lỗi", message: msg });
      setResult(msg);
    }
  };

  return (
    <>
      <AppDialog dialog={dialog as any} setDialog={(d: any) => setDialog(d)} />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full overflow-y-auto scrollbar-hide  max-w-5xl mx-auto p-10 bg-white rounded-2xl shadow-xl border border-gray-100"
      >
        <div className="flex items-start justify-between mb-8 gap-6">
          <div>
            <h2 className="text-4xl font-extrabold text-gray-900">
              Yêu cầu rút tiền
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gửi yêu cầu rút tiền an toàn — tiền sẽ được chuyển về tài khoản
              bạn cung cấp.
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">Số dư hiện tại</div>
            <div className="text-2xl font-semibold text-primary">
              {(auth?.wallet ?? 0).toLocaleString("vi-VN")} đ
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="grid grid-cols-12 gap-8 items-start"
        >
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div>
              <Label className="text-base font-medium">Số tiền (VNĐ)</Label>
              <Input
                type="number"
                placeholder="Nhập số tiền muốn rút (ví dụ: 200000)"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="mt-3 h-14 text-2xl font-semibold tracking-tight"
              />

              <div className="flex flex-wrap gap-3 mt-4">
                {suggestedAmounts.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="px-4 py-2 rounded-full border border-gray-200 text-sm hover:bg-gray-50"
                    onClick={() => handleAmountChange(String(s))}
                  >
                    {s.toLocaleString("vi-VN")} đ
                  </button>
                ))}
              </div>

              {amountText && (
                <div className="mt-3 text-sm text-gray-700 italic">
                  {amountText.charAt(0).toUpperCase() + amountText.slice(1)}
                </div>
              )}
            </div>

            <div>
              <Label className="text-base font-medium">Tài khoản nhận</Label>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={method === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMethod("manual")}
                  >
                    Nhập STK
                  </Button>
                  <Button
                    type="button"
                    variant={method === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMethod("upload")}
                  >
                    Tải ảnh QR
                  </Button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary p-0"
                        aria-label="Hướng dẫn định dạng tài khoản"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Format: <span className="font-mono">STK_NganHang</span>
                      <div className="mt-1">
                        Ví dụ: <span className="font-mono">0123456789_VCB</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="mt-3">
                {method === "manual" && (
                  <Input
                    placeholder="0123456789_Vietcombank"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="h-11 text-base"
                  />
                )}

                {method === "upload" && (
                  <div>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        <UploadCloud className="w-4 h-4 mr-1" />
                        {uploading ? "Đang tải..." : "Chọn ảnh"}
                      </Button>
                      {uploadPreview && (
                        <div className="flex items-center gap-3">
                          <img
                            src={uploadPreview}
                            alt="preview"
                            className="h-20 w-20 object-cover rounded-md border shadow-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearUpload}
                            className="text-sm text-destructive flex items-center gap-1 p-0"
                          >
                            <X className="w-4 h-4" /> Xóa
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Ảnh tối đa 5MB. Ảnh này sẽ được gửi kèm yêu cầu rút tiền.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Ghi chú</Label>
              <Textarea
                placeholder="Lý do rút hoặc ghi chú thêm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-3 min-h-[120px]"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <Button
                type="submit"
                className="px-8 py-3 text-base"
                disabled={uploading}
              >
                Gửi yêu cầu
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAmount(0);
                  setAmountText("");
                  setAccountNumber("");
                  setDescription("Rút tiền về tài khoản");
                  clearUpload();
                  setResult(null);
                }}
              >
                Xóa
              </Button>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-500">Số tiền bạn sẽ nhận</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {amount ? amount.toLocaleString("vi-VN") + " đ" : "0 đ"}
                </div>
                {amountText && (
                  <div className="mt-2 text-sm text-gray-700 italic">
                    {amountText.charAt(0).toUpperCase() + amountText.slice(1)}
                  </div>
                )}
              </div>

              <div className="p-5 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="text-sm text-gray-500">Tài khoản nhận</div>
                <div className="mt-2 font-medium text-gray-900">
                  {accountNumber || "Chưa cung cấp"}
                </div>
                <div className="mt-3">
                  {uploadedUrl ? (
                    <img
                      src={uploadedUrl}
                      alt="uploaded"
                      className="w-full rounded-md object-cover border"
                    />
                  ) : uploadPreview ? (
                    <img
                      src={uploadPreview}
                      alt="preview"
                      className="w-full rounded-md object-cover border"
                    />
                  ) : (
                    <div className="text-xs text-gray-400">
                      Không có ảnh chứng từ
                    </div>
                  )}
                </div>
              </div>

              {result && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  {result}
                </div>
              )}
            </div>
          </aside>
        </form>
      </motion.div>
    </>
  );
};

export default WithdrawRequest;
