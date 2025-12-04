import React from "react";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import Forbidden from "@/common/pages/Forbidden";

type RequireRoleProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  children,
}) => {
  const { user } = useAuthStore();

  const userRoles = (user?.roles || []) as string[];

  // Case-insensitive comparison
  const userRolesNorm = userRoles.map((r) =>
    (r || "").toString().toLowerCase()
  );
  const allowedNorm = allowedRoles.map((r) =>
    (r || "").toString().toLowerCase()
  );
  const has = allowedNorm.some((r) => userRolesNorm.includes(r));

  if (!has) {
    return <Forbidden roles={userRoles} />;
  }

  return <>{children}</>;
};

export default RequireRole;
