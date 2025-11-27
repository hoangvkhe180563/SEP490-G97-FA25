import { Outlet } from "react-router-dom";
import RecommendIndex from "../pages/index";
import LLMInputPage from "../pages/llm-input";
import ResultsPage from "../pages/results";
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
