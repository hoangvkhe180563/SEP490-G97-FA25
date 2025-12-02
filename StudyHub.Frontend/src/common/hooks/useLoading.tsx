import { LoaderIcon } from "lucide-react";
import { createContext, useContext, useState } from "react";

interface LoadingType {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoadingContext = createContext<LoadingType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingContextProvider');
  }
  return context;
};


export const LoadingContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);

  const contextValue = { setLoading };

  return (
    <LoadingContext.Provider value={contextValue}>
      {loading && <div className="absolute inset-0 bg-gray-500/75 flex justify-center items-center z-1000 select-none">
        <LoaderIcon size={50} className="stroke-white animate-spin" />
      </div>}
      {children}
    </LoadingContext.Provider>
  );
}