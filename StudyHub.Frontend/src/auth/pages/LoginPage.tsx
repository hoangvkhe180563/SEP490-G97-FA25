import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../stores/useAuthStore";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/common/components/ui/form";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email hoặc tên đăng nhập là bắt buộc"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    login,
    isLoading,
    loginError,
    loginMessage,
    isAuthenticated,
    sendEmailVerification,
    getGoogleRedirectURL,
    googleRedirectURL,
  } = useAuthStore();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  });

  // keep last submitted identifier so resend can use it
  const [lastIdentifier, setLastIdentifier] = React.useState("");

  // fetch a fresh Google redirect URL when this component mounts
  // also refresh it when the page becomes visible again or when browser navigation occurs
  React.useEffect(() => {
    getGoogleRedirectURL();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") getGoogleRedirectURL();
    };

    const handlePopstate = () => {
      getGoogleRedirectURL();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("popstate", handlePopstate);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("popstate", handlePopstate);
      // clear stored URL when leaving the page so we don't reuse stale link
      useAuthStore.setState({ googleRedirectURL: "" });
    };
  }, [getGoogleRedirectURL]);

  // separate effect: navigate to home when auth becomes available
  // React.useEffect(() => {
  //   if (isAuthenticated && user) navigate("/");
  // }, [isAuthenticated, user, navigate]);

  const { handleSubmit, control } = form;

  const onSubmit = async (data: LoginValues) => {
    // backend accepts username or email. Detect if identifier is an email.
    const identifier = data.identifier.trim();
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (emailRegex.test(identifier)) {
      await login("", identifier, data.password, (user) => {
        if (user) {
          if (user.schoolId !== null) {
            navigate(`/ui/${user?.schoolId}/landing`);
            return;
          }
        }
        navigate("/")
      });
    } else {
      await login(identifier, "", data.password, (user) => {
        if (user) {
          if (user.schoolId !== null) {
            navigate(`/ui/${user?.schoolId}/landing`);
            return;
          }
        }
        navigate("/")
      });
    }
    setLastIdentifier(identifier);
  };

  const onGoogle = () => {
    if (!googleRedirectURL) return;
    window.location.href = googleRedirectURL;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              to="/auth/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Đăng ký
            </Link>
          </p>
        </div>

        <Form {...form}>
          <form
            className="mt-8 space-y-6 bg-white p-8 rounded shadow"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <FormField
              control={control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email hoặc tên đăng nhập</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="email hoặc tên đăng nhập"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="********" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FormField
                  control={control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <input
                          id="remember_me"
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/auth/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            {loginMessage && (
              <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                {loginMessage}
              </div>
            )}
            {loginError && (
              <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                <div>{loginError}</div>
                {/* if error indicates unverified email, show resend option */}
                {typeof loginError === "string" &&
                  loginError.toLowerCase().includes("chưa được xác thực") && (
                    <div className="mt-2">
                      <span>Bạn muốn gửi lại email xác thực?</span>
                      <button
                        type="button"
                        onClick={async () => {
                          // if lastIdentifier is an email use it, otherwise try to use identifier field value
                          const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
                          let emailToSend = "";
                          if (emailRegex.test(lastIdentifier))
                            emailToSend = lastIdentifier;
                          else {
                            // try to read current form value
                            const val = (
                              document.querySelector(
                                'input[name="identifier"]'
                              ) as HTMLInputElement
                            )?.value;
                            if (val && emailRegex.test(val)) emailToSend = val;
                          }

                          if (emailToSend) {
                            await sendEmailVerification(emailToSend);
                          } else {
                            // show error under the identifier input instead of alert
                            form.setError("identifier", {
                              type: "manual",
                              message:
                                "Vui lòng nhập email đã đăng kí với tài khoản để gửi lại mã xác thực.",
                            });
                          }
                        }}
                        className="ml-2 text-indigo-600 hover:text-indigo-500 underline"
                      >
                        Gửi lại
                      </button>
                    </div>
                  )}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang xử lý..." : "Đăng nhập"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={onGoogle}
                className="w-full inline-flex justify-center gap-4 items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <img
                  className="w-5 h-5"
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEkUlEQVR4nO2Zb0wbZRzHn3taesUtRpOJYbo/DoQM5c/GMgryzxkYxbGBiQsbNBCEFGaIY8zCCuaUMSiQAQMGQWAgcSY2GeuNuzpc8NqNvRoCItE3841Dthj3ToNzbX+mVRBI197Zo2VJv8n3XZ+nn89dn6dPrwj5448/HgcoJIWqgGIoxywU4HuQTfwJSsIKBxBAKgJIQzbIJhZBhX+BE/g6VAUU2ccgXwc0UgWU4tvwNmGBJASCqiQsoMa3QRsQ433wOlk4qPEsvCkQ2llTEUAxnoEaFOIdeA3RCumEzWPwtT2IrHCK0K0f+HkUCMX4B9HBk9b0PTwNFJKJC9+NngcVfrDu8En/toJoFw9+EMnhOPGr1+DLCE40eIeAGn/vPXgsMvyHRIfgrbEMT0IlroUmaQpQaAtQKAjOSN6C05hy7Db21zgbW4pN4sI3kyGQQVh5g5+W9PJZfEChZ+ADydAqkVKR4R1vVIHv8IIvwPNwDr0oeP4aFAJ5+P76wJvl22CcfAQaCUCyC/gSPAV6JEEbLWAmdWAmwdHeAIB0wvmV35DweiQBs2x+WcDeURmACv8Hn0lYoAK9hDZiwCSPXwW/VI4E0En/ObuclPSjjRowybROBZY6FPAAyhGJNmrATF5xKWCSdQiZL1gzC2I0XDthO9rUd9e9gImccynAkRm+EAjWzMIbddcW+Qg8dCMQ6iuB3TW3rHwEHrkWQJt9JbCjehKeaoHtVd+C5x+hm7IwXwns1t60Pd2L+JNRHovYTI642UY7fSVwRDc8z0NAduZJ8A+5Z6Geif/jvF4RiEROy3D+puiPvrG4Eii/0DjqXoALVDiDnx0PBhWthENXs6HDGHtJbIGTnfX97u6Arq/iuHsBQBjMsntL4DYzCfRYOGQbDjvg7c2jlZaL11/bJhZ8W496Z2SNyeoK/vVas4XiKH5P88BENtrhfzdthrNMwjL4ylaPJi9wXIrHjwcpjpIeafxswd3VL2lrm+A9KXCBL98df+GvEjrdKfxSP2YTZjyRoDhKmt/SM+d2/6+egsbuylhBkzcwihlX8CvvRP/X4VuFwvfeiNhe1lX3E5/d51hz75zQ+RE9FvZKPq208pHIp5WWzq/2DlCDKXJ38w6PRW1qZ/b15RmU1pyRHDja2uH2FEp9ekrQl+dyutmY1iweAitFGljFdJdxL6VnIw5cGdsVdJkL2zJgjEq8aNxTV8ckTNpfs3JM1kgOFPZQsLXqO6cC77c3dSNPomPjpvkKeNKiwXLYWX1nFfy7TQM/Ik+j10fINHTqfW9IFH5RCJG1Jgd8ev2Xv53o6hJ0cHxiOG7HczVM4oI3JI7pc0HVemGeGq4MEgV+hYT8LBM/K2RN/J+eYxXTRmPo+v3m7jNGNecaMq2iX3lDprWXjWlG3sgwvSe0gY2beseQ5TF4ztXDjqt++caru5C3MzQWGdvM7L9VZDj4WCh4AZ3xuJGJm/icifb+n3xrowck6WeiC1uN+0a1TOLPajptUWVQWu13yH4IzDVk2tSGtMWqa8nzLex+ts8YU2Afg/zxxx/kaf4GzSVnCicBYF0AAAAASUVORK5CYII="
                  alt="google-logo"
                />
                Đăng nhập Google
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
