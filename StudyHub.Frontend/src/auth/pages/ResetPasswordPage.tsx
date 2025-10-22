import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
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

const schema = z
  .object({
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Mật khẩu xác nhận là bắt buộc"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu và xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { resetPassword, isLoading, resetPasswordMessage, resetPasswordError } =
    useAuthStore();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { handleSubmit, control, setError } = form;

  React.useEffect(() => {
    if (!token) {
      setError("password", {
        type: "manual",
        message: "Token không tìm thấy trong URL",
      });
    }
  }, [token, setError]);

  const onSubmit = async (data: Values) => {
    if (!token) return;
    await resetPassword(token, data.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đặt lại mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập mật khẩu mới cho tài khoản của bạn.
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Mật khẩu mới"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Xác nhận mật khẩu"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {resetPasswordMessage && (
              <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                {resetPasswordMessage}
              </div>
            )}
            {resetPasswordError && (
              <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                {resetPasswordError}
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !token}
              >
                {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </Button>
            </div>

            <div className="text-center text-sm">
              <Link
                to="/auth/login"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
