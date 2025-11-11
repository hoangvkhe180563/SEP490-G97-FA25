import { LoadingContextProvider } from "@/common/hooks/useLoading";
import AppRouter from "./AppRouter";
import { Toaster } from "react-hot-toast";
import AccountInactiveModal from "@/auth/components/AccountInactiveModal";
import ActivateFormModal from "@/auth/components/ActivateFormModal";

function App() {
  return (
    <LoadingContextProvider>
      <AppRouter />
      <AccountInactiveModal />
      <ActivateFormModal />
      <Toaster />
    </LoadingContextProvider>
  );
}

export default App;
