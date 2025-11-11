import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Yêu cầu rút tiền</h2>
          <div className="text-sm text-gray-500">
            Số dư hiện tại:
            <strong className="text-primary">
              {auth?.wallet?.toLocaleString("vi-VN") ?? 0}
            </strong>
            đ
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Số tiền */}
          <div>
            <Label className="text-base font-medium">Số tiền (VNĐ)</Label>
            <Input
              type="number"
              placeholder="Nhập số tiền muốn rút (vd: 20 hoặc 500000)"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="mt-2 h-11 text-lg"
            />

            {/* Gợi ý động */}
            <AnimatePresence>
              {suggestedAmounts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex flex-wrap gap-2 mt-3"
                >
                  {suggestedAmounts.map((s, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full px-4 text-sm hover:bg-primary/10"
                      onClick={() => handleAmountChange(String(s))}
                    >
                      {s.toLocaleString("vi-VN")} đ
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hiển thị số tiền bằng chữ */}
            <AnimatePresence>
              {amountText && (
                <motion.div
                  key="amtText"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2 text-sm text-primary font-medium italic"
                >
                  {amountText.charAt(0).toUpperCase() + amountText.slice(1)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tài khoản nhận */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">Tài khoản nhận</Label>
              <div className="flex items-center gap-3">
                {method === "manual" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary p-0"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Format: <span className="font-mono">STK_NganHang</span>
                      (VD: <span className="font-mono">0123456789_VCB</span>)
                    </TooltipContent>
                  </Tooltip>
                )}
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
              </div>
            </div>
            {method === "manual" && (
              <Input
                placeholder="STK_NganHang (VD: 0123456789_Vietcombank)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-11 text-base"
              />
            )}
            {method === "upload" && (
              <div className="mt-3">
                <Label className="text-sm">Ảnh QR</Label>
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
                    <div className="flex items-center gap-2">
                      <img
                        src={uploadPreview}
                        alt="preview"
                        className="h-16 w-16 object-cover rounded-md border shadow-sm"
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

          {/* Ghi chú */}
          <div>
            <Label className="text-base font-medium">Ghi chú</Label>
            <Textarea
              placeholder="Lý do rút hoặc ghi chú thêm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex items-center gap-4 pt-3">
            <Button
              type="submit"
              className="px-6 py-2 text-base"
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
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-lg bg-muted p-3 text-sm border text-gray-700"
          >
            {result}
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default WithdrawRequest;
