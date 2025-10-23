import * as React from "react";
import { Link } from "react-router-dom";
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

const schema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
});

type Values = z.infer<typeof schema>;

const ForgotPasswordPage: React.FC = () => {
  const {
    forgetPassword,
    isLoading,
    forgotPasswordMessage,
    forgotPasswordError,
  } = useAuthStore();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const { handleSubmit, control } = form;

  const onSubmit = async (data: Values) => {
    // call store action
    await forgetPassword(data.email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Quên mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Nhập email của bạn"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {forgotPasswordMessage && (
              <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                {forgotPasswordMessage}
              </div>
            )}
            {forgotPasswordError && (
              <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                {forgotPasswordError}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang xử lý..." : "Gửi hướng dẫn đặt lại"}
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

export default ForgotPasswordPage;
