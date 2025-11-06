import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";

const PaymentFailed: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const msg = search.get("msg") ? decodeURIComponent(search.get("msg")!) : null;
  const orderRef = search.get("orderRef") ?? null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-3">
          Thanh toán thất bại
        </h2>
        <p className="text-gray-600 mb-4">
          Có lỗi xảy ra khi xử lý thanh toán.
        </p>
        {msg && (
          <div className="p-3 bg-red-50 text-red-700 rounded mb-4 text-sm">
            {msg}
          </div>
        )}
        {orderRef && (
          <div className="text-sm text-gray-500 mb-4">
            Mã đơn: <span className="font-mono">{orderRef}</span>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <Button
            onClick={() => {
              // retry: navigate back to checkout with original params (price, name, schoolId, courseId)
              const params = new URLSearchParams();
              const price = search.get("price");
              const name = search.get("name");
              const schoolId = search.get("schoolId");
              const courseId = search.get("courseId");
              if (price) params.set("price", String(price));
              if (name) params.set("name", String(name));
              if (schoolId) params.set("schoolId", String(schoolId));
              if (courseId) params.set("courseId", String(courseId));
              // preserve orderRef if present
              const orderRef = search.get("orderRef");
              if (orderRef) params.set("orderRef", String(orderRef));
              navigate(`/payment/student/checkout?${params.toString()}`);
            }}
          >
            Thử lại
          </Button>

          <Button
            onClick={() => navigate("/courses")}
            className="bg-primary text-white"
          >
            Về trang khóa học
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
