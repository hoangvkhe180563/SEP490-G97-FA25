import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/common/components/ui/avatar";
import type { AppUser } from "@/auth/interfaces/app-user";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
// textarea not needed for teacher profile currently
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/common/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { Calendar as DatePicker } from "@/common/components/ui/calendar";
import { Calendar as CalendarIcon, Camera, Check, Lock, X } from "lucide-react";
import { Badge } from "@/common/components/ui/badge";

const schema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    dob: z.string().optional(),
    schoolLevel: z.string().optional(),
    department: z.string().optional(),
    address: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((d) => (d.newPassword ? d.newPassword === d.confirmPassword : true), {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema> & { photo?: File | null };

const defaultUser: AppUser = {
  id: "teacher-1",
  email: "sarah.johnson@school.edu",
  username: "sarah.t",
  fullname: "John Smith",
  avatar: "/avatars/user1.png",
  roles: ["Teacher"],
  permissions: [],
  classIds: [],
  subjectIds: [],
  schoolId: 0,
  isLoginWithGoogle: false,
  transferId: 0,
};

export default function TeacherProfile() {
  const [preview, setPreview] = useState<string | undefined>(
    defaultUser.avatar
  );
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@school.edu",
      phone: "+1 (555) 123-4567",
      dob: "2008-03-15",
      schoolLevel: "Primary School",
      department: "Mathematics",
      address: "Số 2 Hùng Vương, Ba Đình, Hà Nội",
    },
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = form;
  const newPassword = watch("newPassword");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : undefined);
  }

  const onSubmit = async (data: FormValues) => {
    console.log("save teacher", data, file);
    return new Promise((res) => setTimeout(res, 500));
  };

  // sample chips
  const classes = ["Class 1A", "Class 2B", "Class 2B", "Class 2B", "Class 2B"];
  const subjects = ["Mathematics", "Literature", "Physics"];

  const requirements = [
    {
      id: "length",
      label: "At least 8 characters",
      test: (s?: string) => !!s && s.length >= 8,
    },
    {
      id: "upper",
      label: "At least one uppercase letter",
      test: (s?: string) => !!s && /[A-Z]/.test(s),
    },
    {
      id: "number",
      label: "At least one number",
      test: (s?: string) => !!s && /[0-9]/.test(s),
    },
    {
      id: "special",
      label: "At least one special character",
      test: (s?: string) => !!s && /[^A-Za-z0-9]/.test(s),
    },
  ];

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white rounded-md p-6 shadow"
      >
        <div>
          <h2 className="text-lg font-semibold">Edit Personal Information</h2>
          <p className="text-sm text-gray-500">
            Update your profile information and account settings
          </p>
        </div>

        <div className="p-4 border rounded-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={preview} />
                <AvatarFallback>JS</AvatarFallback>
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
              <div>
                <div className="font-medium text-lg">
                  {defaultUser.fullname}
                </div>
                <div className="text-sm text-gray-500">
                  Role: {defaultUser.roles[0] ?? "Teacher"}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-teal-100">
                  Homeroom Teacher
                </Badge>
                <Badge variant="secondary" className="bg-red-100">
                  Subject Teacher
                </Badge>
                <Badge variant="secondary" className="bg-blue-100">
                  Head of Department
                </Badge>
                <Badge variant="secondary" className="bg-yellow-100">
                  QA Teacher
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              control={control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              control={control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          <span className="text-left">
                            {field.value
                              ? new Date(field.value).toLocaleDateString()
                              : "2008-03-15"}
                          </span>
                          <CalendarIcon className="text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <DatePicker
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date?: Date) => {
                            if (date)
                              field.onChange(date.toISOString().slice(0, 10));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              control={control}
              name="schoolLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Level</FormLabel>
                  <FormControl>
                    <Select onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="w-full">
                        {field.value || "Primary School"}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Primary School">
                          Primary School
                        </SelectItem>
                        <SelectItem value="Middle School">
                          Middle School
                        </SelectItem>
                        <SelectItem value="High School">High School</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Head of department</FormLabel>
                  <FormControl>
                    <Select onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="w-full">
                        {field.value || "Mathematics"}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Literature">Literature</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div />
          </div>
        </div>

        <div className="p-4 border rounded-md">
          <h3 className="font-semibold">Homeroom Teacher Information</h3>
          <p className="text-sm text-gray-500">
            Ensure your account is using a long, random password to stay secure.
          </p>

          <div className="mt-4">
            <div className="text-sm font-medium">Classes</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {classes.map((c, i) => (
                <Badge key={i} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium">Subjects</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {subjects.map((s, i) => (
                <Badge key={i} variant="default">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-md">
          <h3 className="font-semibold">Change Password</h3>
          <p className="text-sm text-gray-500">
            Ensure your account is using a long, random password to stay secure.
          </p>

          <div className="mt-4">
            <FormField
              control={control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormField
                control={control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
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
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-2 border rounded bg-gray-50 p-4">
              <div className="text-sm font-medium mb-2">
                Password Requirements:
              </div>
              <ul className="text-sm space-y-1">
                {requirements.map((r) => (
                  <li key={r.id} className="flex items-start gap-2">
                    <span className="mt-1">
                      {r.test(newPassword) ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <X size={16} className="text-red-600" />
                      )}
                    </span>
                    <span
                      className={`${
                        r.test(newPassword) ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {r.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-black text-white"
            disabled={isSubmitting}
          >
            <Lock className="mr-2" /> Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
