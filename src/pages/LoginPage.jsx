import { Navigate, useLocation } from 'react-router-dom';
import AuthScreen from '../components/AuthScreen';

function LoginPage({ authForm, defaultPath, loading, loginError, successMessage, onChange, onSubmit, token }) {
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || defaultPath;

  if (token) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <AuthScreen
      authForm={authForm}
      loading={loading}
      loginError={loginError}
      successMessage={successMessage}
      onChange={onChange}
      onSubmit={onSubmit}
    />
  );
}

export default LoginPage;
