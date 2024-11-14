import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const useNavigation = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.pathname.includes('/anime/')) {
      localStorage.removeItem('searchQuery');
    }

    if (!router.pathname.includes('/anime')) {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes('selectedCategory_anime')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [router.pathname]);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorEl(null);
  };

  return {
    anchorEl,
    setAnchorEl,
    handleCloseNavMenu,
    handleOpenNavMenu,
  };
};

export default useNavigation;