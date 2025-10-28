import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";


const ClassRedirect: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
    console.log("ClassRedirect user:", user);
  useEffect(() => {
    // choose fallback role when no user present
    const defaultRole: "student" | "teacher" = "student";

    // user may contain .roles (array) or .role (string)
    const rawRoles = user?.roles ?? null;
    const coarse = mapToCoarseRole(rawRoles) ?? defaultRole;

    // navigate to /class/{coarse}
    navigate(`/class/${coarse}`, { replace: true });
  }, [user, navigate]);

  // minimal UI while redirecting
  return (
    <div className="p-6 text-center text-gray-600">
      Chuyển hướng theo vai trò người dùng...
    </div>
  );
};

export default ClassRedirect;