import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, loginResident } from '../services/auth';
import { FiHome, FiUser, FiLock, FiEye, FiEyeOff, FiLoader, FiShield, FiCheckCircle } from 'react-icons/fi';

type LoginTab = 'admin' | 'resident';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LoginTab>('resident');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Resident form
  const [residentId, setResidentId] = useState('');
  const [residentPassword, setResidentPassword] = useState('');

  const handleTabChange = (tab: LoginTab) => {
    setActiveTab(tab);
    setError('');
    setShowPassword(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginAdmin(adminEmail, adminPassword);
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        setError(error.message || 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResidentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentId || !residentPassword) {
      setError('يرجى إدخال رقم الهوية وكلمة المرور');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginResident(residentId, residentPassword);
      navigate('/resident/dashboard');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('رقم الهوية أو كلمة المرور غير صحيحة');
      } else {
        setError(error.message || 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Dynamic Background Glows & Ambient Gradients */}
      <div className="login-bg-glow glow-1" />
      <div className="login-bg-glow glow-2" />
      <div className="login-bg-glow glow-3" />

      {/* Main Luxury Container */}
      <div className="login-container">
        {/* Left / Top Branding Card (Luxury Showcase) */}
        <div className="login-branding-panel">
          <div className="login-badge-luxury">
            <span className="badge-pulse" />
            منظومة السكن الذكية
          </div>
          
          <div className="login-brand-header">
            <div className="login-brand-icon">
              🏢
            </div>
            <div>
              <h1 className="login-brand-title">إدارة العمارة</h1>
              <p className="login-brand-tagline">الإدارة العقارية الذكية والخدمات السكنية الراقية</p>
            </div>
          </div>

          <div className="login-features-list">
            <div className="login-feature-item">
              <div className="login-feature-icon"><FiCheckCircle /></div>
              <div>
                <h4>متابعة الخدمات والفواتير</h4>
                <p>سداد واطلاع فوري على التحصيلات والمستحقات الشهرية</p>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon"><FiCheckCircle /></div>
              <div>
                <h4>تواصل مباشر وشفاف</h4>
                <p>إرسال الاقتراحات والشكاوى وتلقي الإعلانات والإشعارات</p>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon"><FiCheckCircle /></div>
              <div>
                <h4>تقارير وإدارة متكاملة</h4>
                <p>لوحة تحكم إدارية شاملة مع تقارير وإحصائيات دقيقة</p>
              </div>
            </div>
          </div>

          <div className="login-brand-footer" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>© {new Date().getFullYear()} نظام إدارة العمارة السكنية - جميع الحقوق محفوظة</span>
            <span style={{ fontSize: 12, color: 'var(--color-primary-dark)', fontWeight: 700 }}>
              تصميم وتطوير وبرمجة: المهندس / mohammed Suhile EJoujo
            </span>
          </div>
        </div>

        {/* Right / Center Interactive Glass Login Card */}
        <div className="login-card-luxury">
          <div className="login-card-top">
            <h2 className="login-welcome-title">مرحباً بك مجدداً</h2>
            <p className="login-welcome-sub">يرجى اختيار نوع الحساب للمتابعة إلى لوحتك الخاصة</p>
          </div>

          {/* Luxury Modern Tabs */}
          <div className="login-tabs-luxury" role="tablist">
            <button
              id="tab-resident"
              role="tab"
              aria-selected={activeTab === 'resident'}
              className={`login-tab-btn ${activeTab === 'resident' ? 'active' : ''}`}
              onClick={() => handleTabChange('resident')}
              type="button"
            >
              <FiHome className="tab-icon" />
              <span>حساب الساكن</span>
            </button>
            <button
              id="tab-admin"
              role="tab"
              aria-selected={activeTab === 'admin'}
              className={`login-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleTabChange('admin')}
              type="button"
            >
              <FiShield className="tab-icon" />
              <span>مجلس الإدارة</span>
            </button>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="login-alert-box" role="alert">
              <div className="alert-icon">⚠️</div>
              <div className="alert-text">{error}</div>
            </div>
          )}

          {/* Resident Login Form */}
          {activeTab === 'resident' && (
            <form id="form-resident-login" className="login-form-luxury" onSubmit={handleResidentLogin} noValidate>
              <div className="luxury-form-group">
                <label className="luxury-label" htmlFor="resident-id">
                  رقم الهوية الوطنية
                </label>
                <div className="luxury-input-wrapper">
                  <span className="input-affix-icon"><FiHome /></span>
                  <input
                    id="resident-id"
                    type="text"
                    className="luxury-input"
                    placeholder="أدخل رقم الهوية"
                    value={residentId}
                    onChange={e => setResidentId(e.target.value)}
                    autoComplete="username"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="luxury-form-group">
                <label className="luxury-label" htmlFor="resident-password">
                  كلمة المرور
                </label>
                <div className="luxury-input-wrapper">
                  <span className="input-affix-icon"><FiLock /></span>
                  <input
                    id="resident-password"
                    type={showPassword ? 'text' : 'password'}
                    className="luxury-input"
                    placeholder="••••••••"
                    value={residentPassword}
                    onChange={e => setResidentPassword(e.target.value)}
                    autoComplete="current-password"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="إظهار أو إخفاء كلمة المرور"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                id="btn-resident-login"
                type="submit"
                className="luxury-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading-flex">
                    <FiLoader className="spin-icon" /> جاري التحقق والدخول...
                  </span>
                ) : (
                  <span>تسجيل الدخول إلى حساب الساكن</span>
                )}
              </button>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === 'admin' && (
            <form id="form-admin-login" className="login-form-luxury" onSubmit={handleAdminLogin} noValidate>
              <div className="luxury-form-group">
                <label className="luxury-label" htmlFor="admin-email">
                  البريد الإلكتروني للإدارة
                </label>
                <div className="luxury-input-wrapper">
                  <span className="input-affix-icon"><FiUser /></span>
                  <input
                    id="admin-email"
                    type="email"
                    className="luxury-input"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    autoComplete="email"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="luxury-form-group">
                <label className="luxury-label" htmlFor="admin-password">
                  كلمة المرور
                </label>
                <div className="luxury-input-wrapper">
                  <span className="input-affix-icon"><FiLock /></span>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="luxury-input"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    autoComplete="current-password"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="إظهار أو إخفاء كلمة المرور"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                id="btn-admin-login"
                type="submit"
                className="luxury-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading-flex">
                    <FiLoader className="spin-icon" /> جاري التحقق والدخول...
                  </span>
                ) : (
                  <span>تسجيل الدخول كمسؤول إدارة</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
