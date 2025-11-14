import { Button } from "../components/ui/button"

interface NotFoundProps {
  msg?: string
}

const NotFound = ({ msg }: NotFoundProps) => {
  return (
    <div className="w-screen h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-7xl font-bold">404</h1>
        <img src="/404.png" alt="404" className="w-50 py-3" />
        <h2 className="text-3xl font-semibold mt-4">Không tìm thấy trang</h2>
        <p className="text-lg mt-2">{msg ?? "Trang bạn đang tìm không tồn tại."}</p>
        <Button className="mt-4" onClick={() => location.href = '/'}>
          Về trang chủ
        </Button>
      </div>
    </div>
  )
}

export default NotFound