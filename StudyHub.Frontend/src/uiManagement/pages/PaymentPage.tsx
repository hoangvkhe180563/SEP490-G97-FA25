import { UiManagementService } from "../services/UiManagementService";
import { useEffect, useState } from "react";
import type { IPaymentPageService } from "../interfaces/IPaymentPageService";
import PaymentCard from "../components/PaymentCard";

const PaymentPage = () => {
  const [data, setData] = useState<IPaymentPageService>();

  const uiManagementService = new UiManagementService();

  useEffect(() => {
    setData(uiManagementService.getPaymentInformation());
  }, [])

  return (
    <div className="h-screen w-screen bg-gray-100 p-2 sm:p-4 lg:p-6 flex items-center justify-center">
      {data && <PaymentCard data={data} />}
    </div>
  )
}

export default PaymentPage