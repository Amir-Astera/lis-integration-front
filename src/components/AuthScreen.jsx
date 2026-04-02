function AuthScreen({ authForm, loading, loginError, successMessage, onChange, onSubmit }) {
  return (
    <div className="auth-layout">
      <form className="auth-card form-stack" onSubmit={onSubmit}>
        <div>
          <div className="brand-block">
            <div className="brand-mark" />
            <div>
              <div className="brand-title">LIMS Damumed</div>
              <div className="brand-subtitle">Авторизация</div>
            </div>
          </div>
        </div>
        {loginError ? <div className="error-banner">{loginError}</div> : null}
        {successMessage ? <div className="success-banner">{successMessage}</div> : null}
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={authForm.email}
            onChange={(event) => onChange('email', event.target.value)}
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={authForm.password}
            onChange={(event) => onChange('password', event.target.value)}
            required
          />
        </div>
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

export default AuthScreen;
