import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { useNavigate } from "react-router-dom";
import { Edit, Play, Plus } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function ViewLessonButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/teacher/lecture/:id")}
      className={`${
        className ?? ""
      } flex items-center gap-2 text-sm text-[#525252] hover:bg-gray-50 p-1 rounded`}
    >
      <Play className="w-3.5 h-3.5" /> View
    </button>
  );
}

function AddLessonButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/teacher/add-lecture?type=video")}
      className={`${
        className ?? ""
      } w-full h-[38px] border border-dashed border-[#D4D4D4] rounded flex items-center justify-center gap-2 text-sm text-[#525252] hover:bg-gray-50`}
    >
      <Plus className="w-3 h-3.5" /> Add Lesson
    </button>
  );
}

function EditLessonButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/teacher/edit-lecture")}
      className={`${
        className ?? ""
      } flex items-center gap-2 text-sm text-[#525252] hover:bg-gray-50 p-1 rounded`}
    >
      <Edit className="w-3.5 h-3.5" /> Edit
    </button>
  );
}

export {
  Button,
  buttonVariants,
  ViewLessonButton,
  AddLessonButton,
  EditLessonButton,
};
