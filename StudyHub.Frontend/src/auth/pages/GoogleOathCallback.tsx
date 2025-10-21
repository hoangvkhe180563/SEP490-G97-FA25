import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { Loader2 } from "lucide-react";

const GoogleOathCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const state = searchParams.get("state") ?? "";
  const error = searchParams.get("error") ?? "";

  const {
    handleGoogleCallback,
    isLoading,
    handlerGoogleCallbackMessage,
    handlerGoogleCallbackError,
  } = useAuthStore();

  React.useEffect(() => {
    // If error present, nothing to do — let UI show it
    if (!code && !error) return;

    const run = async () => {
      await handleGoogleCallback(code, state, error, () => {
        navigate("/");
      });
    };

    run();
  }, [code, state, error, handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {isLoading && (
            <Loader2 className="mx-auto mb-4 h-20 w-20 animate-spin text-gray-600" />
          )}
          <h2 className="text-2xl font-semibold">
            Đang xử lý đăng nhập bằng Google...
          </h2>
          {handlerGoogleCallbackMessage && (
            <p className="text-sm text-green-700 mt-2">
              {handlerGoogleCallbackMessage}
            </p>
          )}
          {handlerGoogleCallbackError && (
            <p className="text-sm text-red-700 mt-2">
              {handlerGoogleCallbackError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleOathCallback;
