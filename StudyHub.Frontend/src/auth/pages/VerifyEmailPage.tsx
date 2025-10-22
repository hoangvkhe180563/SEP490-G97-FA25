import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { Button } from "@/common/components/ui/button";
import { Check, X } from "lucide-react";

export default function VerifyEmailPage() {
  const { search } = useLocation();
  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const token = params.get("token") || "";
  const {
    verifyEmail,
    verifyEmailMessage: message,
    verifyEmailError: error,
  } = useAuthStore();
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!token) return;
      await verifyEmail(token);
      if (mounted) setDone(true);
    };
    run();
    return () => {
      mounted = false;
    };
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Xác thực email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Trang này sẽ tự xác thực tài khoản khi token có trong URL.
          </p>
        </div>

        <div className="mt-8 space-y-4 bg-white p-8 rounded shadow text-center">
          {!token && (
            <>
              <div className="border-red-500 flex justify-center border-2 rounded-full w-25 h-25 mx-auto items-center">
                <X width={40} height={40} color="red" opacity={0.5} />
              </div>
              <div className="text-sm text-red-700 bg-red-50 p-2 rounded flex items-center flex-col">
                <div className="">
                  <Check width={20} height={20} />
                </div>
                <div>Không tìm thấy token xác thực trong URL.</div>
              </div>
            </>
          )}

          {token && !done && (
            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded">
              Đang xác thực email... Vui lòng chờ.
            </div>
          )}

          {done && message && (
            <>
              <div className="border-green-500 flex justify-center border-2 rounded-full w-25 h-25 mx-auto items-center">
                <Check width={40} height={40} color="green" opacity={0.5} />
              </div>
              <div className="text-sm text-green-700 bg-green-50 p-4 rounded">
                {message}
                <div className="mt-4">
                  <Link to="/auth/login">
                    <Button>Quay lại đăng nhập</Button>
                  </Link>
                </div>
              </div>
            </>
          )}

          {done && error && (
            <>
              <div className="border-red-500 flex justify-center border-2 rounded-full w-25 h-25 mx-auto items-center">
                <X width={40} height={40} color="red" opacity={0.5} />
              </div>
              <div className="text-sm text-red-700 bg-red-50 p-4 rounded flex items-center flex-col">
                {error}
                <Link
                  className="text-red-800 hover:text-red-900"
                  to="/auth/login"
                >
                  Quay lại đăng nhập?
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
