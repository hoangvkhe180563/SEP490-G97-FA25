import { useAuthStore } from "@/auth/stores/useAuthStore";
import RouteConfig from "@/common/constants/RouteConfig";
import ClassRouteConfig from "@/classManagement/constants/ClassRouteConfig";
import CourseRouteConfig from "@/courseManagement/constants/CourseRouteConfig";
import DocumentRouteConfig from "@/documentManagement/constants/DocumentRouteConfig";
import ExamRouteConfig from "@/exam/constants/ExamRouteConfig";
import ForumRouteConfig from "@/forumManagement/constants/ForumRouteConfig";
import PaymentRouteConfig from "@/paymentManagement/constants/PaymentRouteConfig";
import QARouteConfig from "@/qaManagement/constants/QARouteConfig";
import RecommendationRouteConfig from "@/recommend/constants/RecomendationRouteConfig";
import UiManagementRouteConfig from "@/uiManagement/constants/UiManagementRouteConfig";
import UserRouteConfig from "@/user/constants/UserRouteConfig";

type RouteConfigObj = Record<string, any>;
type ConfigMap = Record<string, { prefix: string; config: RouteConfigObj }>;


const CONFIGS: ConfigMap = {
  class: { prefix: RouteConfig.CLASS_MANAGEMENT, config: ClassRouteConfig },
  course: { prefix: RouteConfig.COURSE_MANAGEMENT, config: CourseRouteConfig },
  document: { prefix: RouteConfig.DOCUMENT_MANAGEMENT, config: DocumentRouteConfig },
  exam: { prefix: RouteConfig.EXAM, config: ExamRouteConfig },
  forum: { prefix: RouteConfig.FORUM_MANAGEMENT, config: ForumRouteConfig },
  payment: { prefix: RouteConfig.PAYMENT_MANAGEMENT, config: PaymentRouteConfig },
  qa: { prefix: RouteConfig.QA_MANAGEMENT, config: QARouteConfig },
  recommend: { prefix: RouteConfig.RECOMMENDATION, config: RecommendationRouteConfig },
  ui: { prefix: RouteConfig.UI_MANAGEMENT, config: UiManagementRouteConfig },
  user: { prefix: RouteConfig.USER, config: UserRouteConfig },
};

/* Helpers */
function trimSlash(s?: string) {
  if (!s) return "";
  return String(s).replace(/^\/+|\/+$/g, "");
}
function joinParts(...parts: Array<string | undefined | null>) {
  const cleaned = parts
    .filter(Boolean)
    .map((p) => trimSlash(String(p)))
    .filter(Boolean);
  return "/" + cleaned.join("/");
}

function isRoleToken(s?: string) {
  if (!s) return false;
  const l = s.toLowerCase();
  return l.includes("teacher") || l.includes("student") || l.includes("manager") || (l.includes("school") && l.includes("admin"));
}

function pickRoleKeyFromRoles(roleStrings: string[] = []): "TEACHER" | "STUDENT" | "MANAGER" {
  const normalized = (roleStrings || []).map((r) => String(r).toLowerCase());
  if (normalized.some((r) => r.includes("teacher"))) return "TEACHER";
  if (normalized.some((r) => r.includes("student"))) return "STUDENT";
  return "MANAGER";
}


export function resolveNotificationLinkString(linkUrl?: string, userRoles?: string[]): string | null {
  if (!linkUrl) return null;
  const cleaned = String(linkUrl).trim().replace(/^\/+|\/+$/g, "");
  if (!cleaned) return null;

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const base = parts[0].toLowerCase();
  const mapping = CONFIGS[base];
  if (!mapping) {
    return "/" + cleaned;
  }

  // get role strings
  let roles = userRoles;
  if (!roles) {
    const authUser = useAuthStore.getState().user;
    roles = Array.isArray(authUser?.roles) ? authUser.roles.map((r) => String(r)) : authUser?.roles ? [String(authUser.roles)] : [];
  }
  const chosenRole = pickRoleKeyFromRoles(roles);

  const usedRoleConfig = mapping.config?.[chosenRole];
  const roleIndex = String(usedRoleConfig?.INDEX ?? "").trim();

  
  let remainingParts: string[] = [];
  if (parts.length > 1 && isRoleToken(parts[1])) {
    remainingParts = parts.slice(2);
  } else if (parts.length > 1) {
    remainingParts = parts.slice(1);
  } else {
    remainingParts = [];
  }

  if (roleIndex) {
    return joinParts(mapping.prefix, roleIndex, ...remainingParts);
  }
  return joinParts(mapping.prefix, ...remainingParts);
}

export default resolveNotificationLinkString;