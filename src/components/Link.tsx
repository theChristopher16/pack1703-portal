import { Link as ReactRouterLink, LinkProps as ReactRouterLinkProps } from 'react-router-dom';
import { useOrganization } from '../contexts/OrganizationContext';

/**
 * Custom Link component that automatically prefixes paths with organization slug
 * Use this instead of Link from react-router-dom
 */
export const Link: React.FC<ReactRouterLinkProps> = ({ to, ...props }) => {
  const { prefixPath } = useOrganization();
  
  // Handle string and object to props
  const prefixedTo = typeof to === 'string' 
    ? prefixPath(to)
    : typeof to === 'object' && to.pathname
      ? { ...to, pathname: prefixPath(to.pathname) }
      : to;

  return <ReactRouterLink to={prefixedTo} {...props} />;
};

export default Link;

