import { Outlet } from "react-router-dom";
import RecommendIndex from "../pages/index";
import LLMInputPage from "../pages/llm-input";
import ResultsPage from "../pages/results";
import LlmResultPage from "../pages/llm-result";
import RecommendationRouteConfig from "../constants/RecomendationRouteConfig";

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

const recommendationRoutes = [
  {
    path: RecommendationRouteConfig.STUDENT.INDEX,
    element: <Outlet />,
    children: studentRoutes,
  },
];

export default recommendationRoutes;
