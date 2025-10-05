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
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
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

const profileSchema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    dob: z.string().optional(),
    schoolLevel: z.string().optional(),
    gradeLevel: z.string().optional(),
    address: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((d) => (d.newPassword ? d.newPassword === d.confirmPassword : true), {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ProfileValues = z.infer<typeof profileSchema> & { photo?: File | null };

export default function StudentProfile() {
  const [preview, setPreview] = useState<string | undefined>(
    "/avatars/user1.png"
  );
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
      dob: "2008-03-15",
      schoolLevel: "Primary School",
      gradeLevel: "Grade 9",
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

  const onSubmit = async (data: ProfileValues) => {
    console.log("save profile", data, file);
    return new Promise((res) => setTimeout(res, 500));
  };

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
        <h2 className="text-lg font-semibold">Edit Personal Information</h2>
        <p className="text-sm text-gray-500">
          Update your personal details and account information
        </p>

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
              <div className="font-medium text-lg">John Smith</div>
              <div className="text-sm text-gray-500">Role: Student</div>
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
                              : "mm/dd/yyyy"}
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
                        {field.value || "Select school level"}
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
              name="gradeLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Level</FormLabel>
                  <FormControl>
                    <Select onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="w-full">
                        {field.value || "Select grade level"}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grade 6">Grade 6</SelectItem>
                        <SelectItem value="Grade 7">Grade 7</SelectItem>
                        <SelectItem value="Grade 8">Grade 8</SelectItem>
                        <SelectItem value="Grade 9">Grade 9</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="p-4 border rounded-md">
          <h3 className="text-md font-semibold">Change Password</h3>
          <p className="text-sm text-gray-500">
            Ensure your account is using a long, random password to stay secure.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-4">
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

            <div className="grid grid-cols-2 gap-4">
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
