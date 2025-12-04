import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../stores/useAuthStore";
import { useLocationStore } from "../stores/useLocationStore";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
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
  const navigate = useNavigate();
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

  const { handleSubmit, control, setValue, watch } = form;
  const communeVal = watch("communeId");
  const schoolVal = watch("schoolId");

  // when user focuses city select, fetch cities if empty
  const ensureCities = async () => {
    if (!cities || cities.length === 0) await fetchCities();
  };

  const [cityId, setCityId] = React.useState<number | null>(null);
  const [provinceId, setProvinceId] = React.useState<number | null>(null);

  const onCityChange = async (val: string) => {
    const id = Number(val);
    // reset selected commune id
    setValue("communeId", 0);
    setCityId(id && !isNaN(id) ? id : null);
    if (id && !isNaN(id)) {
      await fetchProvinces(id);
    } else {
      // clear provinces/communes by fetching with invalid id (backend should return empty)
      await fetchProvinces(0);
      await fetchCommunes(0);
      await fetchSchools(0);
    }
  };

  const onProvinceChange = async (val: string) => {
    const id = Number(val);
    setValue("communeId", 0);
    setProvinceId(id && !isNaN(id) ? id : null);
    if (id && !isNaN(id)) await fetchCommunes(id);
    else {
      await fetchCommunes(0);
      await fetchSchools(0);
    }
  };

  const onCommuneChange = async (val: string) => {
    const id = Number(val);
    setValue("communeId", id && !isNaN(id) ? id : 0);
    if (id && !isNaN(id)) await fetchSchools(id);
    else await fetchSchools(0);
  };

  const onSchoolChange = async (val: string) => {
    const id = Number(val);
    setValue("schoolId", id && !isNaN(id) ? id : undefined);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('/bg-auth.png')] bg-[length:100%_100%] bg-no-repeat">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <img
            className="w-50 h-25 mx-auto cursor-pointer"
            onClick={() => navigate("/")}
            src="/StudyHubLogo.png"
            alt="Logo Studyhub"
          />
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
                <Select
                  onOpenChange={(open) => {
                    if (open) ensureCities();
                  }}
                  onValueChange={onCityChange}
                  value={cityId ? String(cityId) : undefined}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Chọn tỉnh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {cities?.map((c: City) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Huyện / Quận
                </label>
                <Select
                  onValueChange={onProvinceChange}
                  value={provinceId ? String(provinceId) : undefined}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Chọn huyện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {provinces?.map((p: Province) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Xã / Phường
                </label>
                <Select
                  onValueChange={onCommuneChange}
                  value={communeVal ? String(communeVal) : undefined}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Chọn xã" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {communes?.map((c: Commune) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trường
                </label>
                <Select
                  onValueChange={onSchoolChange}
                  value={schoolVal ? String(schoolVal) : undefined}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Chọn trường (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {schools?.map((s: School) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
