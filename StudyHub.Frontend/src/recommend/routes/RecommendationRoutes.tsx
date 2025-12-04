import { Outlet } from "react-router-dom";
import RecommendIndex from "../pages/index";
import LLMInputPage from "../pages/llm-input";
import ResultsPage from "../pages/results";
import LlmResultPage from "../pages/llm-result";
import RecommendationRouteConfig from "../constants/RecomendationRouteConfig";
import RecommendStatistics from "../pages/statistics";
import RequireRole from "@/common/components/RequireRole";
import { ROLES } from "@/common/constants/Roles";

const studentRoutes = [
  {
    index: true,
    element: <RecommendIndex />,
  },
  {
    path: RecommendationRouteConfig.STUDENT.LLM,
    element: <LLMInputPage />,
  },
  {
    // Dedicated LLM results route using path param
    path: `${RecommendationRouteConfig.STUDENT.LLM}/:historyId`,
    element: <LlmResultPage />,
  },
  {
    path: RecommendationRouteConfig.STUDENT.RESULTS,
    element: <ResultsPage />,
  },
];

const managerRoutes = [
  {
    index: true,
    element: <RecommendStatistics />,
  },
];

const recommendationRoutes = [
  {
    path: RecommendationRouteConfig.STUDENT.INDEX,
    element: (
      <RequireRole
        allowedRoles={[ROLES.EXTERNAL_STUDENT, ROLES.SCHOOL_STUDENT]}
      >
        <Outlet />
      </RequireRole>
    ),
    children: studentRoutes,
  },
  {
    path: RecommendationRouteConfig.MANAGER.INDEX,
    element: (
      <RequireRole allowedRoles={[ROLES.SCHOOL_ADMIN]}>
        <Outlet />
      </RequireRole>
    ),
    children: managerRoutes,
  },
];

export default recommendationRoutes;
