import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { Check, Loader2, X } from "lucide-react";

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
  const color = isLoading
    ? "text-gray-600"
    : handlerGoogleCallbackMessage
    ? "text-green-600"
    : "text-red-600";
  const googleCallBackedRef = React.useRef(false);

  React.useEffect(() => {
    // If error present, nothing to do — let UI show it
    if (!code && !error && !state) return;

    if (googleCallBackedRef.current) return;
    googleCallBackedRef.current = true;

    const run = async () => {
      await handleGoogleCallback(
        code,
        state,
        error,
        () => {
          navigate("/");
        },
        () => {
          navigate("/auth/login");
        }
      );
    };

    run();
  }, [code, state, error, handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {isLoading && (
            <>
              <Loader2
                className={`mx-auto mb-4 h-20 w-20 animate-spin ${color}`}
              />
              <h2 className="text-2xl font-semibold">
                Đang xử lý đăng nhập bằng Google...
              </h2>
            </>
          )}
          {handlerGoogleCallbackMessage && (
            <>
              <Check className={`mx-auto mb-4 h-20 w-20 ${color}`} />
              <p className={`text-2xl font-semibold ${color}`}>
                {handlerGoogleCallbackMessage}
              </p>
            </>
          )}
          {handlerGoogleCallbackError && (
            <>
              <X className={`mx-auto mb-4 h-20 w-20 ${color}`} />
              <p className={`text-2xl font-semibold ${color}`}>
                {handlerGoogleCallbackError}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleOathCallback;
