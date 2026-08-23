import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onAuthorized: () => void;
  action?: string;
  actionData?: any;
};

export default function RequireAuthButton({ onAuthorized, action, actionData, children, ...rest }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (user) return onAuthorized();
    // store post-auth action and redirect to login
    if (action) {
      try { sessionStorage.setItem('postAuthAction', JSON.stringify({ action, actionData })); } catch {}
    }
    const next = location.pathname + (location.search || '');
    navigate(`/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <button {...rest} onClick={handleClick}>
      {children}
    </button>
  );
}
