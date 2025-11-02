import { useEffect, useState } from 'react';

const useDocumentVisibility = () => {
  const [isVisible, setIsVisible] = useState(document.visibilityState === 'visible');

  useEffect(() => {
    const handleVisibilityChange = (e) => {
      e.stopImmediatePropagation();
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange, true);
    setInterval(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('visibilitychange', handleVisibilityChange, true);
    }, 2000);


    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

export default useDocumentVisibility;