import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Checkbox } from "@/common/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import { Calendar as DatePicker } from "@/common/components/ui/calendar";
import { Calendar as CalendarIcon, CloudUpload } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/common/components/ui/form";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui/popover";

const schema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    username: z.string().min(1, "Required"),
    phone: z.string().optional(),
    dob: z.string().optional(),
    accountType: z.string().min(1, "Select account type"),
    welcomeEmail: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema> & { profileImage?: File | null };

const CreateAccount: React.FC = () => {
  const navigate = useNavigate();

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      phone: "",
      dob: "",
      accountType: "",
      welcomeEmail: false,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: FormValues) => {
    console.log("submit", data, file);
    return new Promise((res) => setTimeout(res, 500));
  };

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
      // If you want to store file in form state:
      // setValue("profileImage" as any, f)
    } else {
      setPreview(null);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white rounded-xl p-6 shadow-md"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email Address <span className="text-rose-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter email address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Password <span className="text-rose-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter password"
                  />
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
                  Confirm Password <span className="text-rose-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Confirm password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Username <span className="text-rose-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter username" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter phone number" />
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
                    <PopoverContent
                      align="start"
                      className="w-auto p-0 overflow-hidden"
                    >
                      <DatePicker
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        captionLayout="dropdown"
                        onSelect={(date: Date | undefined) => {
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

        <FormItem>
          <FormLabel>Profile Image</FormLabel>
          <div className="mt-2 border-dashed border-2 border-gray-200 rounded-lg p-6 text-center">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="mx-auto mb-4 max-h-48 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center">
                <CloudUpload className="mx-auto mb-2 text-gray-400" size={48} />
                <div className="text-sm text-gray-500">
                  Drop your image here or click to browse
                  <div className="text-xs text-gray-400 mt-1">
                    Recommended size: 1280×720px
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4">
              <input
                id="profile"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
              <label htmlFor="profile" className="inline-block">
                <Button type="button">Choose File</Button>
              </label>
            </div>
          </div>
        </FormItem>

        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Account Type <span className="text-rose-500">*</span>
              </FormLabel>
              <FormControl>
                <Select onValueChange={(val) => field.onChange(val)}>
                  <SelectTrigger className="w-full">
                    <span className="text-sm text-gray-700">
                      {field.value || "Select account type"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="welcomeEmail"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(!!v)}
                />
              </FormControl>
              <FormLabel className="!mb-0">
                Send welcome email to user
              </FormLabel>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-black text-white"
            disabled={isSubmitting}
          >
            Create Account
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateAccount;
