import { Navigate } from 'react-router-dom';

// Donor portal has been removed. All visitors are redirected to the public donate page.
export function Register() {
  return <Navigate to="/donate" replace />;
}
