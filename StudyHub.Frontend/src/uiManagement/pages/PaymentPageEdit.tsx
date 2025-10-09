import { useEffect, useState } from "react";
import type { IPaymentPageService } from "../interfaces/IPaymentPageService";
import { UiManagementService } from "../services/UiManagementService";
import PaymentCard from "../components/PaymentCard";
import PaymentEditCard from "../components/PaymentEditCard";

const PaymentPageEdit = () => {
  const [data, setData] = useState<IPaymentPageService>();

  const uiManagementService = new UiManagementService();

  useEffect(() => {
    setData(uiManagementService.getPaymentInformation());
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const source = URL.createObjectURL(file);
      setData(prevData => prevData ? { ...prevData, qrCode: source } : undefined);
    }
  }

  return (
    <div className="h-screen w-screen bg-gray-100">
      {data && <div className="w-full h-full flex">
        <div className="w-1/2 flex flex-col items-center p-10 border-r-2 border-black">
          <div className="text-center text-2xl font-bold mb-2">Sửa thông tin giao dịch:</div>
          <PaymentEditCard data={data} setData={setData} handleFileChange={handleFileChange} />
        </div>
        <div className="w-1/2 flex flex-col items-center p-10">
          <div className="text-center text-2xl font-bold mb-2">Xem trước:</div>
          <PaymentCard data={data} />
        </div>
      </div>}
    </div>
  )
}

export default PaymentPageEdit