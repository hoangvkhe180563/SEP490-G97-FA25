import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/common/components/ui/avatar";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/common/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/common/components/ui/form";
import { Camera, Lock, Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import { Badge } from "@/common/components/ui/badge";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useLocationStore } from "@/user/stores/useLocationStore";
import { createFallBack } from "@/user/utils/avatarUtils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type { UpdateProfileDto } from "../interfaces/dtos";
import { isValidVietnamPhone } from "../utils/phoneUtils";
import useDobStore from "@/user/stores/useDobStore";

// Vietnam phone validator

const profileSchema = z
  .object({
    email: z.string().email("Định dạng email không hợp lệ").optional(),
    username: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z
      .string()
      .optional()
      .refine((v) => !v || isValidVietnamPhone(v), {
        message: "Số điện thoại không hợp lệ",
      }),
    dob: z
      .string()
      .optional()
      .refine((v) => !v || useDobStore.getState().isValidDisplayDob(v), {
        message: "Ngày sinh không hợp lệ. Định dạng dd/mm/yyyy",
      }),
    fullname: z.string().optional(),
    communeId: z.union([z.string(), z.number()]).optional(),
    cityId: z.string().optional(),
    provinceId: z.string().optional(),
    schoolId: z.string().optional(),
    oldPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
    gender: z.union([z.literal("0"), z.literal("1")]).optional(),
  })
  .refine(
    (d) => (d.newPassword ? d.newPassword === d.confirmNewPassword : true),
    {
      path: ["confirmNewPassword"],
      message: "Mật khẩu xác nhận không khớp",
    }
  )
  .refine(
    (d) => (d.newPassword ? !!d.oldPassword && d.oldPassword.length > 0 : true),
    {
      path: ["oldPassword"],
      message: "Vui lòng nhập mật khẩu cũ để đổi mật khẩu",
    }
  );

type FormValues = z.infer<typeof profileSchema> & { photo?: File | null };

export default function UpdateProfile() {
  const { getProfile, currentUser, updateProfile, isLoading } =
    useAppUserStore();
  const { user } = useAuthStore();
  const {
    fetchCities,
    fetchProvinces,
    fetchCommunes,
    fetchSchools,
    cities,
    provinces,
    communes,
    schools,
  } = useLocationStore();

  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [displayedUsername, setDisplayedUsername] = useState<
    string | undefined
  >(undefined);
  const [displayedOldPassword, setDisplayedOldPassword] =
    useState<boolean>(false);

  useEffect(() => {
    if (typeof user !== "undefined" && user !== null) {
      setDisplayedOldPassword(!user.isLoginWithGoogle);
    }
  }, [user]);
  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      username: "",
      address: "",
      phoneNumber: "",
      dob: undefined,
      fullname: "",
      cityId: undefined,
      provinceId: undefined,
      communeId: undefined,
      schoolId: undefined,
      oldPassword: undefined,
      newPassword: undefined,
      confirmNewPassword: undefined,
      gender: undefined,
    },
  });

  const { handleSubmit, reset, setValue, setError, formState } = form;
  const { isSubmitting } = formState;

  // DOB calendar state
  const [dobOpen, setDobOpen] = useState(false);
  const [selectedDob, setSelectedDob] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const v = form.getValues("dob");
    if (v) {
      try {
        const d = parse(String(v), "dd/MM/yyyy", new Date());
        if (!isNaN(d.getTime())) setSelectedDob(d);
      } catch (e) {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchCities();
      await getProfile();
      const user = useAppUserStore.getState().currentUser;
      if (!user) return;
      if (user.cityId) await fetchProvinces(Number(user.cityId));
      if (user.provinceId) await fetchCommunes(Number(user.provinceId));
      if (user.communeId) await fetchSchools(Number(user.communeId));

      reset({
        email: user.email ?? "",
        username: user.username ?? "",
        fullname: user.fullname ?? user.username ?? "",
        address: (user as any)?.address ?? "",
        phoneNumber: (user as any)?.phoneNumber ?? "",
        cityId: user.cityId ? String(user.cityId) : undefined,
        provinceId: user.provinceId ? String(user.provinceId) : undefined,
        communeId: user.communeId ? String(user.communeId) : undefined,
        schoolId: user.schoolId ? String(user.schoolId) : undefined,
        dob: (user as any)?.dob
          ? useDobStore.getState().isoToDisplay((user as any).dob) ?? undefined
          : undefined,
        gender:
          typeof user.gender !== "undefined"
            ? user.gender
              ? "1"
              : "0"
            : undefined,
      });

      if (user.avatar) setPreview(user.avatar);
      setDisplayedUsername(user.username ?? undefined);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : undefined);
  }

  const onCityChange = async (value?: string) => {
    const cityId = Number(value || 0);
    setValue("cityId", cityId ? String(cityId) : undefined);
    setValue("provinceId", undefined);
    setValue("communeId", undefined);
    setValue("schoolId", undefined);
    if (cityId) {
      await fetchProvinces(cityId);
      await fetchCommunes(0);
      await fetchSchools(0);
    } else {
      await fetchProvinces(0);
      await fetchCommunes(0);
      await fetchSchools(0);
    }
  };

  const onProvinceChange = async (value?: string) => {
    const provId = Number(value || 0);
    setValue("provinceId", provId ? String(provId) : undefined);
    setValue("communeId", undefined);
    setValue("schoolId", undefined);
    if (provId) {
      await fetchCommunes(provId);
      await fetchSchools(0);
    } else {
      await fetchCommunes(0);
      await fetchSchools(0);
    }
  };

  const onCommuneChange = async (value?: string) => {
    const commId = Number(value || 0);
    setValue("communeId", commId ? String(commId) : undefined);
    if (commId) await fetchSchools(commId);
    else await fetchSchools(0);
  };

  const onSchoolChange = async (value?: string) => {
    const s = Number(value || 0);
    setValue("schoolId", s ? String(s) : undefined);
  };

  const onSubmit = async (data: FormValues) => {
    const dto: UpdateProfileDto = {};
    if (data.email) dto.email = data.email;
    if (data.username) dto.username = data.username;
    if (data.fullname) dto.fullname = data.fullname;
    if (data.phoneNumber) dto.phoneNumber = data.phoneNumber;
    if (data.address) dto.address = data.address;
    if (typeof data.communeId !== "undefined" && data.communeId !== undefined)
      dto.communeId = Number(data.communeId);
    if (typeof data.schoolId !== "undefined" && data.schoolId !== undefined)
      dto.schoolId = Number(data.schoolId);
    if (typeof data.gender !== "undefined") dto.gender = Number(data.gender);
    if (data.oldPassword) dto.oldPassword = data.oldPassword;
    if (data.newPassword) dto.newPassword = data.newPassword;
    if (file) dto.avatarFile = file;
    // Convert display dob dd/MM/yyyy to ISO yyyy-MM-dd for backend
    if (data.dob)
      dto.dob = useDobStore.getState().displayToIso(data.dob) ?? null;

    const mapBackendKeyToField = (key: string) => {
      // common mappings from backend keys to our form field names
      const k = key || "";
      if (k.toLowerCase() === "avatar" || k.toLowerCase() === "avatarfile")
        return "photo";
      // generic: lowercase first char (OldPassword -> oldPassword)
      return k.charAt(0).toLowerCase() + k.slice(1);
    };

    const handleMessage = (msg: any) => {
      if (msg && typeof msg === "object") {
        Object.entries(msg).forEach(([k, v]) => {
          const field = mapBackendKeyToField(k);
          const messageText = Array.isArray(v) ? v.join(", ") : String(v ?? "");
          try {
            setError(field as any, { type: "server", message: messageText });
          } catch (e) {
            toast.error(messageText || "Cập nhật thất bại");
          }
        });
      }
    };

    try {
      const res = await updateProfile(dto);
      const body = res?.data ?? res;
      if (body?.success ?? true) {
        setDisplayedUsername(body?.username ?? undefined);
        console.log("data", data);
        if (data.newPassword) setDisplayedOldPassword(true);
        toast.success(body?.message ?? "Cập nhật hồ sơ thành công");
      } else {
        handleMessage(body?.message);
      }
    } catch (err: any) {
      const body = err?.response?.data ?? err?.data ?? err;
      handleMessage(body?.message ?? err?.message ?? body);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white rounded-md p-6 shadow overflow-y-auto h-full"
      >
        <div className="p-4 border rounded-md">
          <h2 className="mb-4 text-xl font-bold">Thông tin chi tiết</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Bạn có thể thay đổi thông tin của hồ sơ này tại đây.
          </p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={preview} />
                <AvatarFallback>
                  {createFallBack(form.getValues("fullname"))}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0">
                <label htmlFor="photo" className="cursor-pointer">
                  <div className="bg-white border rounded-full p-1 shadow">
                    <Camera className="size-4" />
                  </div>
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
              </div>
            </div>
            <div>
              <div className="font-medium text-lg">
                {displayedUsername || "Người dùng"}
              </div>
              <div className="text-sm text-gray-500">
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="text-sm">Vai trò:</div>
                  {(currentUser?.roles || []).length > 0 ? (
                    (currentUser?.roles || []).map((r: string, i: number) => (
                      <Badge key={i} variant="default" className="text-xs">
                        {r}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">
                      Chưa có vai trò
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {formState.errors?.photo?.message && (
            <p className="text-sm text-red-600 mt-2">
              {String(formState.errors.photo.message)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mt-6">
            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Họ và tên" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên đăng nhập</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Tên đăng nhập" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Số điện thoại" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày sinh</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="dd/MM/yyyy"
                        readOnly
                        onClick={() => setDobOpen((s) => !s)}
                      />
                      <button
                        type="button"
                        onClick={() => setDobOpen((s) => !s)}
                        className="absolute right-2 top-2 p-1"
                        aria-label="Open calendar"
                      >
                        <Calendar size={16} />
                      </button>
                      {dobOpen && (
                        <div className="absolute z-50 mt-2 bg-white rounded-md shadow p-2">
                          <DayPicker
                            mode="single"
                            selected={selectedDob}
                            onSelect={(d) => {
                              if (d) {
                                setSelectedDob(d);
                                const s = format(d, "dd/MM/yyyy");
                                field.onChange(s);
                              }
                              setDobOpen(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giới tính</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(v) => field.onChange(v)}
                      value={field.value ?? undefined}
                    >
                      <SelectTrigger className="w-full mt-1">
                        {field.value === undefined && "Chọn giới tính"}
                        {field.value === "1" && "Nam"}
                        {field.value === "0" && "Nữ"}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nam</SelectItem>
                        <SelectItem value="0">Nữ</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* address moved down and spans two columns */}
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Địa chỉ" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tỉnh / Thành</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        onCityChange(v);
                      }}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Chọn tỉnh / thành" />
                      </SelectTrigger>
                      <SelectContent>
                        {(cities || []).map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="provinceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Huyện / Quận</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        onProvinceChange(v);
                      }}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Chọn huyện / quận" />
                      </SelectTrigger>
                      <SelectContent>
                        {(provinces || []).map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="communeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phường / Xã</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        onCommuneChange(v);
                      }}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Chọn phường / xã" />
                      </SelectTrigger>
                      <SelectContent>
                        {(communes || []).map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schoolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trường (tùy chọn)</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        onSchoolChange(v);
                      }}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Chọn trường" />
                      </SelectTrigger>
                      <SelectContent>
                        {(schools || []).map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="p-4 border rounded-md">
          <h2 className="mb-4 text-xl font-bold">Đổi mật khẩu</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Bạn có thể thay đổi mật khẩu tại đây.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {displayedOldPassword && (
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu cũ</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => window.history.back()}
          >
            Huỷ
          </Button>
          <Button
            type="submit"
            className="bg-black text-white"
            disabled={isSubmitting || isLoading}
          >
            <Lock className="mr-2" /> Lưu thay đổi
          </Button>
        </div>
      </form>
    </Form>
  );
}
