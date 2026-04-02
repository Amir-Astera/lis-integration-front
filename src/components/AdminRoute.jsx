import { Navigate, Outlet, useLocation } from 'react-router-dom';

function AdminRoute({ isAdmin }) {
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default AdminRoute;
