import AuthRouteConfig from "../constants/AuthRouteConfig";
import ForgotPasswordPage from "../pages/ForgotPassword";
import GoogleOathCallback from "../pages/GoogleOathCallback";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";

const authRoutes = [
  {
    path: AuthRouteConfig.LOGIN,
    element: <LoginPage />,
  },
  {
    path: AuthRouteConfig.REGISTER,
    element: <RegisterPage />,
  },
  {
    path: AuthRouteConfig.VERIFY_EMAIL,
    element: <VerifyEmailPage />,
  },
  {
    path: AuthRouteConfig.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },
  {
    path: AuthRouteConfig.RESET_PASSWORD,
    element: <ResetPasswordPage />,
  },
  {
    path: AuthRouteConfig.GOOGLE_OAUTH_CALLBACK,
    element: <GoogleOathCallback />,
  },
];

export default authRoutes;
