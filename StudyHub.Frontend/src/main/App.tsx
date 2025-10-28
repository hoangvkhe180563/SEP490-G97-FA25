import { LoadingContextProvider } from "@/common/hooks/useLoading";
import AppRouter from "./AppRouter";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <LoadingContextProvider>
      <AppRouter />
      <Toaster />
    </LoadingContextProvider>
  );
}

export default App;
