import React, { useState } from 'react';
import { createAdminAccount } from '../../services/auth';

const CreateAdmin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      await createAdminAccount(email, password, name);
      setStatus('✅ تم إنشاء حساب الأدمن بنجاح! يمكنك الآن حذف هذه الصفحة والدخول من /login');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatus(`❌ خطأ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0A0A0A', padding: 20
    }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #333', borderRadius: 16,
        padding: 40, width: '100%', maxWidth: 420
      }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: 8, fontFamily: 'Tajawal, sans-serif' }}>
          🛡️ إنشاء حساب أدمن
        </h2>
        <p style={{ color: '#666', textAlign: 'center', fontSize: 13, marginBottom: 28, fontFamily: 'Tajawal, sans-serif' }}>
          ⚠️ هذه الصفحة للإعداد فقط - احذفها بعد الاستخدام
        </p>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="text"
            placeholder="الاسم (مثلاً: مجلس الإدارة)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            dir="ltr"
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="كلمة المرور (8 أحرف على الأقل)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            dir="ltr"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              background: loading ? '#065f46' : '#059669',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Tajawal, sans-serif',
            }}
          >
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>

        {status && (
          <div style={{
            marginTop: 20, padding: '14px', borderRadius: 10,
            background: status.startsWith('✅') ? '#064e3b' : '#450a0a',
            color: status.startsWith('✅') ? '#6ee7b7' : '#fca5a5',
            fontSize: 13, textAlign: 'center', fontFamily: 'Tajawal, sans-serif',
            lineHeight: 1.6,
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  padding: '11px 14px', background: '#2a2a2a',
  border: '1.5px solid #444', borderRadius: 10,
  color: 'white', fontSize: 14, outline: 'none',
  fontFamily: 'Tajawal, sans-serif', width: '100%',
  boxSizing: 'border-box',
};

export default CreateAdmin;
