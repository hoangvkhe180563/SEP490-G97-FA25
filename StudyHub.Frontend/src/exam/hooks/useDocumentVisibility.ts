import { useEffect, useState } from 'react';

const useDocumentVisibility = () => {
  const [isVisible, setIsVisible] = useState(document.visibilityState === 'visible');

  useEffect(() => {
    const handleVisibilityChange = (e: Event) => {
      e.stopImmediatePropagation();
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    
    const reloadInterval = setInterval(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('visibilitychange', handleVisibilityChange, true);
    }, 2000);


    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(reloadInterval);
    };
  }, []);

  return isVisible;
};

export default useDocumentVisibility;