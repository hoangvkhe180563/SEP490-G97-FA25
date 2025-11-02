import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
// textarea not used in update form (kept for create)
import { Ban, Camera, AlertCircle, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useAppRoleStore } from "@/user/stores/useRoleStore";
import { useLocationStore } from "@/user/stores/useLocationStore";
import { Badge } from "@/common/components/ui/badge";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/common/components/ui/alert-dialog";
import { createFallBack } from "@/user/utils/avatarUtils";
import type { EditAccountDto } from "@/user/interfaces/dtos";

// Vietnam phone validator
const isValidVietnamPhone = (s?: string | null) => {
  if (!s) return false;
  const v = String(s).replace(/\s|-/g, "");
  const re = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;
  return re.test(v);
};

const schema = z.object({
  email: z.string().email("Invalid email").optional(),
  username: z.string().optional(),
  fullname: z.string().optional(),
  communeId: z.union([z.string(), z.number()]).optional(),
  cityId: z.string().optional(),
  provinceId: z.string().optional(),
  schoolId: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
  gender: z.union([z.literal("0"), z.literal("1"), z.literal("2")]).optional(),
  address: z.string().optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine((v) => !v || isValidVietnamPhone(v), {
      message: "Số điện thoại không hợp lệ",
    }),
  status: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema> & { avatar?: File | null };

const UpdateAccount: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? "";

  const { getAppUserById, updateAccount, updateUserStatus, isLoading } =
    useAppUserStore();
  const { getAppRoles, appRoles } = useAppRoleStore();
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

  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  // removed unused currentStatus state - form's `status` value is authoritative
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const rolesRef = useRef<HTMLDivElement | null>(null);

  const initial = {
    email: "",
    username: "",
    fullname: "",
    cityId: undefined,
    provinceId: undefined,
    communeId: undefined,
    schoolId: undefined,
    roleIds: [] as string[],
    gender: undefined as any,
    status: true,
    address: "",
    phoneNumber: "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...initial,
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    getValues,
    formState,
  } = form;

  const mapBackendKeyToField = (key: string) => {
    const k = key || "";
    if (k.toLowerCase() === "avatar" || k.toLowerCase() === "avatarfile")
      return "avatar";
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

  const selectedRoles = watch("roleIds") || [];

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : undefined);
  }

  useEffect(() => {
    const loadData = async () => {
      await getAppRoles();
      await fetchCities();

      if (id) {
        const data = await getAppUserById(id);
        const user = data?.data ?? data;
        if (user) {
          if (user.cityId) await fetchProvinces(Number(user.cityId));
          if (user.provinceId) await fetchCommunes(Number(user.provinceId));
          if (user.communeId) await fetchSchools(Number(user.communeId));

          const normalizeGender = (() => {
            const g = user.gender;
            if (typeof g === "boolean") return g ? "1" : "0";
            if (typeof g === "number") return String(g);
            if (typeof g === "string") {
              if (g === "true") return "1";
              if (g === "false") return "0";
              return g;
            }
            return undefined;
          })();

          const rolesList = useAppRoleStore.getState().appRoles || [];
          const mappedRoleIds = (user.roles ?? []).map((r: any) => {
            const val = r?.id ?? r;
            const byName = rolesList.find(
              (a: any) => String(a.name) === String(val)
            );
            if (byName) return String(byName.id);
            return String(val);
          });

          reset({
            email: user.email ?? "",
            username: user.username ?? "",
            fullname: user.fullname ?? user.username ?? "",
            cityId: user.cityId ? String(user.cityId) : undefined,
            provinceId: user.provinceId ? String(user.provinceId) : undefined,
            communeId: user.communeId ? String(user.communeId) : undefined,
            schoolId: user.schoolId ? String(user.schoolId) : undefined,
            roleIds: mappedRoleIds,
            gender:
              typeof normalizeGender !== "undefined"
                ? (normalizeGender as any)
                : undefined,
            status:
              typeof user.status !== "undefined" ? Boolean(user.status) : true,
          });

          if (user.avatar) setPreview(user.avatar);

          const currentRoles = (user.roles ?? []).map((r: any) => {
            const val = r?.id ?? r;
            const byName = (appRoles || []).find(
              (a: any) => String(a.name) === String(val)
            );
            if (byName) return String(byName.id);
            return String(val);
          });
          setCurrentRoles(currentRoles);
          // form value `status` already reflects current status; no separate state needed
        }
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  function removeRole(idRole: string) {
    const prev = getValues("roleIds") || [];
    setValue(
      "roleIds",
      prev.filter((x: any) => String(x) !== String(idRole))
    );
  }

  function addRole(idRole: string) {
    const prev = getValues("roleIds") || [];
    if (prev.find((x: any) => String(x) === String(idRole))) return;
    setValue("roleIds", [...prev, idRole]);
  }

  const onSubmit = async (data: FormValues) => {
    if (!id) return;

    const resolvedRoleIds: string[] = (data.roleIds ?? []).map((r: any) => {
      const raw = String(r);
      const byId = (appRoles || []).find((a: any) => String(a.id) === raw);
      if (byId) return String(byId.id);
      const byName = (appRoles || []).find((a: any) => String(a.name) === raw);
      if (byName) return String(byName.id);
      return raw;
    });

    const dto: EditAccountDto = {};
    if (data.email) dto.email = data.email;
    if (data.username) dto.username = data.username;
    if (data.fullname) dto.fullname = data.fullname;
    if (data.phoneNumber) dto.phoneNumber = data.phoneNumber;
    if (typeof data.communeId !== "undefined" && data.communeId !== undefined)
      dto.communeId = Number(data.communeId);
    if (typeof data.schoolId !== "undefined" && data.schoolId !== undefined)
      dto.schoolId = Number(data.schoolId);
    if (resolvedRoleIds.length > 0) dto.roleIds = resolvedRoleIds;
    if (typeof data.gender !== "undefined" && data.gender !== undefined)
      dto.gender = Number((data as any).gender);
    if (typeof data.status !== "undefined") dto.status = Boolean(data.status);
    if (file) dto.avatarFile = file;
    if (data.address) dto.address = data.address;

    try {
      const res = await updateAccount(id, dto);
      const body = (res as any)?.data ?? res;
      if (body?.success ?? body?.Success ?? false) {
        toast.success(body?.message ?? "Cập nhật tài khoản thành công");
      } else {
        handleMessage(body?.message ?? body);
      }
    } catch (err: any) {
      const body = err?.response?.data ?? err?.data ?? err;
      handleMessage(body?.message ?? err?.message ?? body);
    }
  };

  const handleConfirmToggle = async () => {
    if (!id) return;
    const statusValue = getValues("status");
    const newStatus = statusValue ? "Inactive" : "Active";
    // Optimistic update: update the UI immediately, then persist.
    // If server call fails, revert and show error.
    const prev = statusValue;
    setValue("status", newStatus === "Active");
    try {
      const ok = await updateUserStatus(id, newStatus as any);
      if (ok) {
        toast.success(
          newStatus === "Active"
            ? "Tài khoản đã được kích hoạt"
            : "Tài khoản đã được vô hiệu hoá"
        );
      } else {
        // revert
        setValue("status", prev);
        toast.error(
          newStatus === "Active"
            ? "Không thể kích hoạt tài khoản"
            : "Không thể vô hiệu hoá tài khoản"
        );
      }
    } catch (err) {
      // revert on error
      setValue("status", prev);
      toast.error(
        newStatus === "Active"
          ? "Không thể kích hoạt tài khoản"
          : "Không thể vô hiệu hoá tài khoản"
      );
      console.log(err);
    }
  };
  // remove debug log

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl p-6 shadow-md space-y-6 max-h-screen overflow-auto"
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={preview} />
              <AvatarFallback>
                {createFallBack(form.getValues("fullname"))}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0">
              <label htmlFor="avatar" className="cursor-pointer">
                <div className="bg-white border rounded-full p-1 shadow">
                  <Camera className="size-4" />
                </div>
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="w-full">
            <div className="font-medium text-lg">
              {form.getValues("username") || "Người dùng"}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentRoles.length > 0 ? (
                currentRoles.map((rid: any) => {
                  const role = (appRoles || []).find(
                    (r: any) =>
                      String(r.id) === String(rid) ||
                      String(r.name) === String(rid)
                  );
                  const roleName = role ? role.name : String(rid);
                  return (
                    <Badge
                      key={String(rid)}
                      className="flex items-center gap-2 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove role ${roleName}`}
                    >
                      <span className="text-sm">{roleName}</span>
                    </Badge>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">Chưa có vai trò</div>
              )}
            </div>
          </div>
        </div>
        {formState.errors?.avatar?.message && (
          <p className="text-sm text-red-600 mt-2">
            {String(formState.errors.avatar.message)}
          </p>
        )}

        <div className="col-span-3 grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Địa chỉ email <span className="text-rose-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Địa chỉ email" />
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
                <FormLabel>
                  Tên đăng nhập <span className="text-rose-500">*</span>
                </FormLabel>
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
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giới tính</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <span className="text-sm text-gray-700">
                        {field.value === "1"
                          ? "Nam"
                          : field.value === "0"
                          ? "Nữ"
                          : field.value === "2"
                          ? "Khác"
                          : "Chọn giới tính"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Nam</SelectItem>
                      <SelectItem value="0">Nữ</SelectItem>
                      <SelectItem value="2">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tỉnh / Thành phố</FormLabel>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                <FormLabel>Trường</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      onSchoolChange(v);
                    }}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Chọn trường (tùy chọn)" />
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

        <div className="grid grid-cols-1 gap-4">
          <FormItem className="w-full">
            <FormLabel>Vai trò</FormLabel>
            <div className="mt-2 flex flex-col gap-2">
              <div
                className="flex flex-wrap gap-2 max-h-36 overflow-auto pr-2"
                ref={rolesRef}
              >
                {selectedRoles.map((rid: any) => {
                  const role = (appRoles || []).find(
                    (r: any) =>
                      String(r.id) === String(rid) ||
                      String(r.name) === String(rid)
                  );
                  const roleName = role ? role.name : String(rid);
                  return (
                    <Badge
                      key={String(rid)}
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => removeRole(String(rid))}
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove role ${roleName}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          removeRole(String(rid));
                        }
                      }}
                    >
                      <span className="text-sm">{roleName}</span>
                      <span className="opacity-60" aria-hidden>
                        ×
                      </span>
                    </Badge>
                  );
                })}
              </div>

              <div className="mt-2">
                <Select
                  onValueChange={(v) => {
                    if (!v) return;
                    addRole(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <span className="text-sm text-gray-700">Thêm vai trò</span>
                  </SelectTrigger>
                  <SelectContent>
                    {(appRoles || [])
                      .filter(
                        (r: any) =>
                          !selectedRoles.some(
                            (s: any) =>
                              String(s) === String(r.id) ||
                              String(s) === String(r.name)
                          )
                      )
                      .map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FormItem>
        </div>

        <div className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {getValues("status") ? (
                <Button variant="destructive">
                  <Ban /> <span>Vô hiệu hoá tài khoản</span>
                </Button>
              ) : (
                <Button variant="checked">
                  <Check /> <span>Kích hoạt tài khoản</span>
                </Button>
              )}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <div className="flex items-start gap-4">
                <div className="min-w-0">
                  <AlertDialogHeader className="text-left">
                    <AlertDialogTitle className="text-base">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="text-red-600" />
                        {getValues("status")
                          ? "Bạn có chắc chắn muốn vô hiệu hoá tài khoản này?"
                          : "Bạn có chắc chắn muốn kích hoạt tài khoản này?"}
                      </div>
                    </AlertDialogTitle>
                    <div className="h-px bg-gray-300" />
                    <AlertDialogDescription className="mt-1 text-sm text-muted-foreground">
                      {getValues("status")
                        ? "Hành động này sẽ ngăn người dùng đăng nhập và sử dụng dịch vụ. Bạn có thể kích hoạt lại tài khoản sau này nếu cần."
                        : "Hành động này sẽ cho phép người dùng đăng nhập lại."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
              </div>
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel>Không, huỷ bỏ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmToggle}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Đang tiến hành..."
                    : getValues("status")
                    ? "Có, tôi chắc chắn"
                    : "Có, kích hoạt"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
            <Button
              type="submit"
              className="bg-black text-white"
              disabled={formState.isSubmitting}
            >
              Cập nhật
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default UpdateAccount;
