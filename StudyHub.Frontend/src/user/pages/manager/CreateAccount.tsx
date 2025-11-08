import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import { Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/common/components/ui/select";
import { CloudUpload } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/common/components/ui/form";
import { useNavigate } from "react-router-dom";
// popovers / date picker are not used in this simplified create form
import type { CreateAccountDto } from "@/user/interfaces/dtos";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useAppRoleStore } from "@/user/stores/useRoleStore";
import { Badge } from "@/common/components/ui/badge";
import { useLocationStore } from "@/user/stores/useLocationStore";
import toast from "react-hot-toast";
import { isValidVietnamPhone } from "@/user/utils/phoneUtils";
import useDobStore from "@/user/stores/useDobStore";

const schema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
    username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
    phone: z.string().optional(),
    dob: z
      .string()
      .optional()
      .refine((v) => !v || useDobStore.getState().isValidDisplayDob(v), {
        message: "Ngày sinh không hợp lệ. Định dạng dd/mm/yyyy",
      }),
    communeId: z.union([z.string(), z.number()]).optional(),
    cityId: z.string().optional(),
    provinceId: z.string().optional(),
    schoolId: z.string().optional(),
    fullname: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z
      .string()
      .optional()
      .refine((v) => !v || isValidVietnamPhone(v), {
        message: "Số điện thoại không hợp lệ",
      }),
    roleIds: z.array(z.union([z.string(), z.number()])).optional(),
    // gender stored as string in form but represents numeric codes: "1"=Male, "0"=Female, "2"=Other
    gender: z
      .union([z.literal("0"), z.literal("1"), z.literal("2")])
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema> & { avatar?: File | null };

const CreateAccount: React.FC = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const rolesRef = useRef<HTMLDivElement | null>(null);
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      address: "",
      phoneNumber: "",
      fullname: "",
      cityId: undefined,
      provinceId: undefined,
      communeId: undefined,
      schoolId: undefined,
      gender: undefined,
      roleIds: [],
    },
  });

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    setError,
    formState,
    getValues,
  } = form;

  // DOB calendar state
  const [dobOpen, setDobOpen] = useState(false);
  const [selectedDob, setSelectedDob] = useState<Date | undefined>(undefined);

  // initialize selectedDob from existing display value if present
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

  const mapBackendKeyToField = (key: string) => {
    const k = key || "";
    // map backend avatar keys to our form field name 'avatar'
    if (k.toLowerCase() === "avatar" || k.toLowerCase() === "avatarfile")
      return "avatar";
    return k.charAt(0).toLowerCase() + k.slice(1);
  };

  const handleMessage = (msg: any) => {
    // Defensive handling of server messages/errors.
    // The backend sometimes returns a structured validation error object
    // (e.g. { Email: ["..."] }) or, in other cases, the full user object.
    // If it's the latter we should NOT set form field errors using the
    // field values (that causes the UI to display the current value as an error).
    if (!msg) return;

    if (typeof msg === "string") {
      toast.error(msg);
      return;
    }

    if (typeof msg === "object") {
      Object.entries(msg).forEach(([k, v]) => {
        const field = mapBackendKeyToField(k);

        // Only treat arrays of strings or plain string messages as validation
        // errors. If backend returned booleans/numbers/objects (common when it
        // returns the entity), skip setting a form error to avoid showing
        // values as error messages (e.g. avatar URL, true/false).
        if (Array.isArray(v)) {
          const messageText = v.join(", ");
          try {
            setError(field as any, { type: "server", message: messageText });
          } catch (e) {
            toast.error(messageText || "Cập nhật thất bại");
          }
          return;
        }

        if (typeof v === "string") {
          const messageText = v;
          // Skip obvious non-error strings such as URLs or when the message
          // equals the current form value (the backend returned the entity).
          if (/^https?:\/\//i.test(messageText)) return;
          try {
            const current = form.getValues(field as any);
            if (String(current) === messageText) return;
            setError(field as any, { type: "server", message: messageText });
          } catch (e) {
            toast.error(messageText || "Cập nhật thất bại");
          }
          return;
        }

        // For booleans/numbers/objects skip setting field errors
        return;
      });
      return;
    }

    // Fallback: show whatever arrived
    try {
      toast.error(String(msg));
    } catch (e) {
      /* ignore */
    }
  };

  const onSubmit = async (data: FormValues) => {
    const dto: CreateAccountDto = {
      email: data.email,
      password: data.password,
      username: data.username,
      // ensure communeId is numeric (backend expects int)
      communeId: Number(data.communeId ?? 0),
      // include schoolId when provided
      schoolId: Number(data.schoolId ?? 0),
      // include dob if provided (frontend stores dob as string)
      // send dob as ISO yyyy-MM-dd to backend (convert from display dd/MM/yyyy)
      dob: useDobStore.getState().displayToIso(data.dob ?? null),
      fullname: data.fullname,
      // ensure roleIds are strings (GUIDs expected by backend)
      roleIds: (data.roleIds ?? []).map((r: any) => String(r)),
      // convert gender code to number
      gender: Number(data.gender ?? 0),
      avatarFile: file ?? null,
      phoneNumber: data.phoneNumber,
      address: data.address,
    };

    try {
      await useAppUserStore.getState().createAccount(
        dto,
        (message?: string) => {
          toast.success(message || "Tạo tài khoản thành công");
        },
        (message?: string) => {
          toast.error(message || "Tạo tài khoản không thành công");
        }
      );
    } catch (err: any) {
      const body = err?.response?.data ?? err?.data ?? err;
      handleMessage(body?.message ?? err?.message ?? body);
    }
  };

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setValue("avatar", f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  const selectedRoles = watch("roleIds") || [];

  useEffect(() => {
    getAppRoles();
    fetchCities();
  }, [fetchCities, getAppRoles]);

  const onCityChange = async (value?: string) => {
    const id = Number(value || 0);
    // reset downstream values (use undefined to clear controlled Select values)
    setValue("cityId", id ? String(id) : undefined);
    setValue("provinceId", undefined);
    setValue("communeId", undefined);
    setValue("schoolId", undefined);
    if (id) {
      await fetchProvinces(id);
      await fetchCommunes(0);
      await fetchSchools(0);
      setValue("provinceId", undefined);
      setValue("communeId", undefined);
      setValue("schoolId", undefined);
    } else {
      await fetchProvinces(0);
      await fetchCommunes(0);
      await fetchSchools(0);
    }
  };

  const onProvinceChange = async (value?: string) => {
    const id = Number(value || 0);
    setValue("provinceId", id ? String(id) : undefined);
    // clear downstream values
    setValue("communeId", undefined);
    setValue("schoolId", undefined);
    if (id) {
      await fetchCommunes(id);
      await fetchSchools(0);
    } else {
      await fetchCommunes(0);
      await fetchSchools(0);
    }
  };

  const onCommuneChange = async (value?: string) => {
    const id = Number(value || 0);
    setValue("communeId", id ? String(id) : undefined);
    if (id) await fetchSchools(id);
    else await fetchSchools(0);
  };

  const onSchoolChange = async (value?: string) => {
    const id = Number(value || 0);
    setValue("schoolId", id ? String(id) : undefined);
  };

  // helper to remove a role id
  function removeRole(id: string) {
    const prev = getValues("roleIds") || [];
    setValue(
      "roleIds",
      prev.filter((x: any) => String(x) !== String(id))
    );
  }

  function addRole(id: string) {
    const prev = getValues("roleIds") || [];
    if (prev.find((x: any) => String(x) === String(id))) return;
    setValue("roleIds", [...prev, id]);
  }

  // location handlers are inlined in the Select onValueChange callbacks below

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white rounded-xl p-6 shadow-md max-h-screen overflow-auto"
      >
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1 flex flex-col items-center gap-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-200 flex items-center justify-center bg-gray-50">
              {preview ? (
                // small circular preview
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <CloudUpload className="text-gray-400" size={36} />
              )}
            </div>
            {formState.errors?.avatar?.message && (
              <p className="text-sm text-red-600">
                {String(formState.errors.avatar.message)}
              </p>
            )}
            <div className="w-full text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("profile")?.click()}
              >
                Choose Avatar
              </Button>

              <input
                id="profile"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
            <FormItem className="w-full">
              <div className="flex items-center justify-between w-full">
                <FormLabel>Vai trò</FormLabel>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {appRoles.length === 0 ? (
                  <div className="text-sm text-gray-500">Chưa có vai trò</div>
                ) : (
                  <>
                    <div
                      className="flex flex-wrap gap-2 max-h-36 overflow-auto pr-2"
                      ref={rolesRef}
                    >
                      {(selectedRoles || []).map((rid: any) => {
                        const role = appRoles.find(
                          (r) => String(r.id) === String(rid)
                        );
                        return role ? (
                          <Badge
                            key={String(rid)}
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => removeRole(String(rid))}
                            role="button"
                            tabIndex={0}
                            aria-label={`Remove role ${role.name}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                removeRole(String(rid));
                              }
                            }}
                          >
                            <span className="text-sm">{role.name}</span>
                            <span className="opacity-60" aria-hidden>
                              ×
                            </span>
                          </Badge>
                        ) : null;
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
                          <span className="text-sm text-gray-700">
                            Thêm vai trò
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {appRoles
                            .filter(
                              (r) =>
                                !(selectedRoles || []).some(
                                  (s: any) => String(s) === String(r.id)
                                )
                            )
                            .map((r) => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </FormItem>
          </div>

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
              control={control}
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mật khẩu <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Mật khẩu" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </FormLabel>
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
                    <Select onValueChange={(v) => field.onChange(v)}>
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
                control={control}
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

            <div className="col-span-2">
              <FormField
                control={control}
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
                          {cities.map((c: any) => (
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
            </div>

            <div className="col-span-2">
              <FormField
                control={control}
                name="provinceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Huyện / Quận</FormLabel>
                    <FormControl>
                      <Select
                        key={`province-${watch("cityId") || "empty"}`}
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
                          {provinces.map((p: any) => (
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

            <div className="col-span-2">
              <FormField
                control={control}
                name="communeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phường / Xã</FormLabel>
                    <FormControl>
                      <Select
                        key={`commune-${watch("provinceId") || "empty"}`}
                        onValueChange={(v) => {
                          onCommuneChange(v);
                          field.onChange(v);
                        }}
                        value={field.value ? String(field.value) : undefined}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Chọn phường / xã" />
                        </SelectTrigger>
                        <SelectContent>
                          {communes.map((c: any) => (
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
            </div>

            <div className="col-span-2">
              <FormField
                control={control}
                name="schoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trường</FormLabel>
                    <FormControl>
                      <Select
                        key={`school-${watch("communeId") || "empty"}`}
                        onValueChange={(v) => {
                          onSchoolChange(v);
                          field.onChange(v);
                        }}
                        value={field.value ? String(field.value) : undefined}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Chọn truờng (tuỳ chọn)" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((s: any) => (
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
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Hủy
          </Button>
          <Button
            type="submit"
            className="bg-black text-white"
            disabled={formState.isSubmitting}
          >
            Tạo tài khoản
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateAccount;
