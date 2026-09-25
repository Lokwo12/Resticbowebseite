import { Navigate } from 'react-router-dom';

// Donor portal has been removed. All visitors are redirected to the public donate page.
export function Login() {
  return <Navigate to="/donate" replace />;
}
