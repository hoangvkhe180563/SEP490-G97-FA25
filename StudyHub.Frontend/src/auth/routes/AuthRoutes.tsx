import AuthRouteConfig from "../constants/AuthRouteConfig";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

const authRoutes = [
  {
    path: AuthRouteConfig.LOGIN,
    element: <LoginPage />,
  },
  {
    path: AuthRouteConfig.REGISTER,
    element: <RegisterPage />,
  },
];

export default authRoutes;
