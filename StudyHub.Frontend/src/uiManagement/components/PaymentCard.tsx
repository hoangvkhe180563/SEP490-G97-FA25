import { ArrowLeftRight, CreditCard, QrCode } from "lucide-react"
import type { IPaymentPageService } from "../interfaces/IPaymentPageService"

const PaymentCard = (props: { data: IPaymentPageService }) => {
  return (
    <div className="max-w-full bg-white rounded-lg shadow-xl overflow-hidden flex flex-col lg:flex-row p-3">
      <div className="flex-1 p-6 border-b lg:border-r lg:border-b-0 border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center">
          <CreditCard className="mr-3 text-gray-600" size={24} />
          Thông tin tài khoản
        </h2>

        <div className="space-y-6">
          <div className="border-l-4 border-sky-500 rounded-md shadow-md p-2">
            <p className="text-sm font-medium text-gray-500 mb-1">CHỦ TÀI KHOẢN</p>
            <p className="text-lg font-semibold text-red-500">{props.data.accountName}</p>
          </div>
          <div className="border-l-4 border-sky-500 rounded-md shadow-md p-2">
            <p className="text-sm font-medium text-gray-500 mb-1">SỐ TÀI KHOẢN</p>
            <p className="text-lg font-semibold text-red-500">{props.data.accountNumber}</p>
          </div>
          <div className="border-l-4 border-sky-500 rounded-md shadow-md p-2">
            <p className="text-sm font-medium text-gray-500 mb-1">NGÂN HÀNG</p>
            <p className="text-lg font-semibold text-red-500">{props.data.accountBank}</p>
          </div>
        </div>

        <div className="mt-8">
          <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg text-lg font-bold shadow-md transition-all duration-300">
            TỶ GIÁ QUY ĐỔI CỐ ĐỊNH: <br />
            <span className="flex items-center justify-center text-xl mt-1">
              <span className="relative mr-2 -top-0.5">
                <ArrowLeftRight />
              </span>
              1 xu = {props.data.exchangeRate} VND
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center">
          <QrCode className="mr-3 text-gray-600" size={24} />
          Quét mã QR để nạp tiền
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed text-center">
          Sử dụng ứng dụng ngân hàng để quét mã QR và chuyển tiền tự động
        </p>

        <div className="flex justify-center items-center bg-white rounded-lg shadow-inner">
          <img
            src={props.data.qrCode}
            alt="QR Code for payment"
            className="w-full max-w-xs h-auto object-contain"
          />
        </div>

        <p className="text-sm text-gray-500 mt-3 text-center leading-relaxed">
          <span className="font-bold text-red-500">LƯU Ý:</span> Vui lòng đợi 1-2 phút để StudyHub <br />
          xác thực giao dịch!
        </p>
      </div>
    </div>
  )
}

export default PaymentCard