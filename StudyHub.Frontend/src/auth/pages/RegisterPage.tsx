import * as React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../stores/useAuthStore";
import { useLocationStore } from "../stores/useLocationStore";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import type { City } from "../interfaces/city";
import type { Province } from "../interfaces/province";
import type { Commune } from "../interfaces/commune";
import type { School } from "../interfaces/school";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/common/components/ui/form";

const registerSchema = z
  .object({
    username: z.string().min(3, "Tên đăng nhập ít nhất 3 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6),
    fullName: z.string().min(1, "Họ tên là bắt buộc"),
    phoneNumber: z.string().min(7, "Số điện thoại không hợp lệ"),
    communeId: z.number().int().positive(),
    schoolId: z.number().int().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const {
    register: registerAction,
    isLoading,
    registerMessage: message,
    registerError: error,
  } = useAuthStore();
  const {
    cities,
    provinces,
    communes,
    schools,
    fetchCities,
    fetchProvinces,
    fetchCommunes,
    fetchSchools,
    // we won't call the selected setters directly to avoid nullable typing mismatches
  } = useLocationStore();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phoneNumber: "",
      communeId: 0,
      schoolId: undefined,
    },
  });

  const { handleSubmit, control, setValue } = form;

  // when user focuses city select, fetch cities if empty
  const ensureCities = async () => {
    if (!cities || cities.length === 0) await fetchCities();
  };

  const onCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    // reset selected commune id
    setValue("communeId", 0);
    if (id) {
      await fetchProvinces(id);
    } else {
      // clear provinces/communes by fetching with invalid id (backend should return empty)
      await fetchProvinces(0);
      await fetchCommunes(0);
      await fetchSchools(0);
    }
  };

  const onProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setValue("communeId", 0);
    if (id) await fetchCommunes(id);
    else {
      await fetchCommunes(0);
      await fetchSchools(0);
    }
  };

  const onCommuneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setValue("communeId", id);
    if (id) await fetchSchools(id);
    else await fetchSchools(0);
  };

  const onSchoolChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setValue("schoolId", id);
  };

  const onSubmit = async (data: RegisterValues) => {
    await registerAction(
      data.username,
      data.email,
      data.password,
      data.fullName,
      data.phoneNumber,
      data.communeId,
      data.schoolId
    );
    // after register, do not redirect. The store will expose a message to show.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng ký
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              to="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Đăng nhập
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
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đăng nhập</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
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
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tỉnh / Thành phố
                </label>
                <select
                  onFocus={ensureCities}
                  onChange={onCityChange}
                  className="mt-1 block w-full rounded border-gray-300 py-2 px-3"
                >
                  <option value="">Chọn tỉnh</option>
                  {cities?.map((c: City) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Huyện / Quận
                </label>
                <select
                  onChange={onProvinceChange}
                  className="mt-1 block w-full rounded border-gray-300 py-2 px-3"
                >
                  <option value="">Chọn huyện</option>
                  {provinces?.map((p: Province) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Xã / Phường
                </label>
                <select
                  onChange={onCommuneChange}
                  className="mt-1 block w-full rounded border-gray-300 py-2 px-3"
                >
                  <option value="">Chọn xã</option>
                  {communes?.map((c: Commune) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trường
                </label>
                <select
                  onChange={onSchoolChange}
                  className="mt-1 block w-full rounded border-gray-300 py-2 px-3"
                >
                  <option value="">Chọn trường (tùy chọn)</option>
                  {schools?.map((s: School) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {message && (
              <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                {message}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang xử lý..." : "Đăng ký"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
