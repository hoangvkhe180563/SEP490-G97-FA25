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
import { Textarea } from "@/common/components/ui/textarea";
import { Ban, Calendar as CalendarIcon, Camera } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { Calendar as DatePicker } from "@/common/components/ui/calendar";
import { useNavigate } from "react-router-dom";

const schema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6).optional(),
    confirmPassword: z.string().optional(),
    username: z.string().min(1, "Required"),
    phone: z.string().optional(),
    dob: z.string().optional(),
    accountType: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((d) => (d.password ? d.password === d.confirmPassword : true), {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema> & { photo?: File | null };

const UpdateAccount: React.FC = () => {
  const navigate = useNavigate();
  // Sample initial data — in real app you'd fetch
  const initial = {
    email: "johndoe@example.com",
    username: "John Doe",
    phone: "0123456789",
    dob: "2001-09-11",
    accountType: "",
    address: "Ngo 120 Pho Yen Lang, Phuong ABC, Quan XYZ, Ha Noi",
  };

  const [preview, setPreview] = useState<string | undefined>(
    "/avatars/user1.png"
  );
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...initial,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : undefined);
  }

  const onSubmit = async (data: FormValues) => {
    console.log("update", data, file);
    return new Promise((res) => setTimeout(res, 500));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl p-6 shadow-md space-y-6"
      >
        <div className="flex items-center gap-6">
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email Address <span className="text-rose-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Username <span className="text-rose-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
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

        <div>
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <FormControl>
                  <Select onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger className="w-full">
                      {field.value || "Select account type"}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <Button variant="destructive">
            <Ban />
            Deactivate account
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-black text-white"
              disabled={isSubmitting}
            >
              Update Account
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default UpdateAccount;
