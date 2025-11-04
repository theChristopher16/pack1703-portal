import { useNavigate as useReactRouterNavigate } from 'react-router-dom';
import { useOrganization } from '../contexts/OrganizationContext';

/**
 * Custom navigate hook that automatically prefixes paths with organization slug
 * Use this instead of useNavigate from react-router-dom
 */
export const useNavigate = () => {
  const navigate = useReactRouterNavigate();
  const { prefixPath } = useOrganization();

  return (path: string | number, options?: { replace?: boolean; state?: any }) => {
    if (typeof path === 'number') {
      // Handle relative navigation (back/forward)
      navigate(path);
    } else {
      // Prefix path with organization slug
      const prefixedPath = prefixPath(path);
      navigate(prefixedPath, options);
    }
  };
};

