import { Button } from "@/common/components/ui/button"
import type { IPaymentPageService } from "../interfaces/IPaymentPageService"
import { Input } from "@/common/components/ui/input"

const PaymentEditCard = (props: { data: IPaymentPageService, setData: (data: IPaymentPageService) => void, handleFileChange: React.ChangeEventHandler<HTMLInputElement> }) => {
  const handleSave = () => {
    console.log(props.data);
  }

  const handleCancel = () => {
    location.href = '/ui/payment';
  }
  
  return (
    <div className="w-3/5 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col gap-3 p-6">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <label htmlFor="accountName" className="text-gray-700 font-medium sm:w-1/3 mb-2 sm:mb-0">
            Chủ tài khoản
          </label>
          <Input
            id="accountName"
            type="text"
            value={props.data.accountName}
            onChange={(e) => props.setData({ ...props.data, accountName: e.target.value })}
            className="sm:w-2/3"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <label htmlFor="accountNumber" className="text-gray-700 font-medium sm:w-1/3 mb-2 sm:mb-0">
            Số tài khoản
          </label>
          <Input
            id="accountNumber"
            type="text"
            value={props.data.accountNumber}
            onChange={(e) => props.setData({ ...props.data, accountNumber: e.target.value ?? 0 })}
            className="sm:w-2/3"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <label htmlFor="bankName" className="text-gray-700 font-medium sm:w-1/3 mb-2 sm:mb-0">
            Ngân hàng
          </label>
          <Input
            id="bankName"
            type="text"
            value={props.data.accountBank}
            onChange={(e) => props.setData({ ...props.data, accountBank: e.target.value })}
            className="sm:w-2/3"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <label htmlFor="exchangeRate" className="text-gray-700 font-medium sm:w-1/3 mb-2 sm:mb-0">
            Tỷ giá (1 xu)
          </label>
          <Input
            id="exchangeRate"
            type="number"
            value={props.data.exchangeRate}
            onChange={(e) => props.setData({ ...props.data, exchangeRate: e.target.value })}
            className="sm:w-2/3"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between">
          <label htmlFor="qrCodeUpload" className="text-gray-700 font-medium sm:w-1/3 mb-2 sm:mb-0">
            QR Code
          </label>
          <div className="sm:w-2/3 flex flex-col items-center">
            <Input
              id="qrCodeUpload"
              type="file"
              accept="image/*"
              onChange={props.handleFileChange}
            />
          </div>
        </div>

        <div className="flex justify-center space-x-4 pt-4">
          <Button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2">
            Lưu thay đổi
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 border-gray-300">
            Hủy
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PaymentEditCard