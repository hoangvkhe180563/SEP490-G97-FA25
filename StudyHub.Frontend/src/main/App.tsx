import { LoadingContextProvider } from "@/common/hooks/useLoading";
import AppRouter from "./AppRouter";

function App() {
  return <LoadingContextProvider>
    <AppRouter/>
  </LoadingContextProvider>
}

export default App;
