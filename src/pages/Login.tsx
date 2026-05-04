import { useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { User, Lock, Eye, EyeOff, Shirt } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DEMO_CREDENTIALS, STORES } from '@/data/mockData';
import type { User as UserType } from '@/types';

const STORE_OPTIONS = [
  { value: '', label: '请选择门店' },
  ...STORES.map(s => ({ value: s.id, label: s.name })),
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [store, setStore] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!store) newErrors.store = '请选择门店';
    if (!account.trim()) newErrors.account = '请输入账号';
    if (!password) newErrors.password = '请输入密码';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [store, account, password]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const matched = DEMO_CREDENTIALS.find(
        c => c.account === account.trim() && c.password === password
      );

      if (matched) {
        const storeData = STORES.find(s => s.id === store);
        const user: UserType = {
          id: `u_${matched.account}`,
          account: matched.account,
          name: matched.account === 'admin' ? '系统管理员' : matched.account === 'shop01' ? '李华' : matched.account === 'staff01' ? '张丽' : '王强',
          role: matched.role,
          storeId: store,
          storeName: storeData?.name || '总店',
          phone: '13800138001',
          status: 'active',
          lastLogin: new Date().toISOString(),
        };
        login(user);
        setIsLoading(false);
        navigate('/home');
      } else {
        setIsLoading(false);
        setShakeForm(true);
        setErrors({ general: '账号或密码错误' });
        setTimeout(() => setShakeForm(false), 400);
      }
    }, 800);
  }, [validate, store, account, password, login, navigate]);

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#F8F5F2]">
      {/* Ambient Gradient Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="animate-drift absolute h-[500px] w-[600px] rounded-full"
          style={{
            left: '30%',
            top: '30%',
            background: 'radial-gradient(ellipse 600px 500px at 40% 50%, rgba(212, 133, 60, 0.18) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="animate-drift-reverse absolute h-[400px] w-[400px] rounded-full"
          style={{
            right: '10%',
            top: '10%',
            background: 'radial-gradient(ellipse 400px 400px at 80% 20%, rgba(74, 155, 142, 0.12) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="animate-drift absolute h-[500px] w-[500px] rounded-full"
          style={{
            left: '5%',
            bottom: '10%',
            background: 'radial-gradient(ellipse 500px 400px at 20% 80%, rgba(199, 92, 58, 0.10) 0%, transparent 60%)',
            filter: 'blur(80px)',
            animationDelay: '5s',
          }}
        />
      </div>

      {/* Subtle dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(45, 41, 38, 0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-[960px] flex-col items-center px-6 lg:flex-row lg:justify-between">
        {/* Brand Section */}
        <div className="mb-10 text-center lg:mb-0 lg:text-left">
          <h1 className="font-display text-5xl font-bold tracking-tight text-[#2D2926] lg:text-[56px]">
            StyleStock
          </h1>
          <p className="mt-3 text-lg text-[#6B6560]">
            服装门店进销存系统
          </p>
          <div className="mx-auto mt-6 h-[3px] w-[60px] rounded-full bg-[#D4853C] lg:mx-0" />
          <p className="mx-auto mt-4 max-w-[320px] text-sm text-[#A39E99] lg:mx-0">
            精准管理 · 高效运营 · 数据驱动
          </p>
          {/* Decorative garment illustration */}
          <div className="mt-12 hidden opacity-15 lg:block">
            <Shirt className="h-[200px] w-[200px] text-[#2D2926]" strokeWidth={0.5} />
          </div>
        </div>

        {/* Login Form Card */}
        <div
          className={`w-full max-w-[420px] rounded-[20px] bg-white p-8 shadow-[0_1px_3px_rgba(45,41,38,0.06)] sm:p-10 ${shakeForm ? 'animate-shake' : ''}`}
          style={{
            animation: shakeForm ? 'shake 0.4s ease' : 'fade-in-up 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) 0.15s both',
          }}
        >
          {/* Header */}
          <div>
            <h2 className="font-display text-[32px] font-semibold text-[#2D2926]">
              欢迎回来
            </h2>
            <p className="mt-1 text-[15px] text-[#6B6560]">
              请登录您的账户
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {/* General Error */}
            {errors.general && (
              <div className="rounded-xl bg-[rgba(199,92,58,0.08)] px-4 py-2.5 text-sm text-[#C75C3A]">
                {errors.general}
              </div>
            )}

            {/* Store Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">
                所属门店
              </label>
              <div className="relative">
                <select
                  value={store}
                  onChange={e => { setStore(e.target.value); setErrors(p => { const n = { ...p }; delete n.store; delete n.general; return n; }); }}
                  className={`h-11 w-full appearance-none rounded-xl border bg-white px-4 text-sm text-[#2D2926] transition-all focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none ${errors.store ? 'border-[#C75C3A]' : 'border-[rgba(45,41,38,0.12)]'}`}
                >
                  {STORE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A39E99]">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              {errors.store && <p className="mt-1 text-xs text-[#C75C3A]">{errors.store}</p>}
            </div>

            {/* Account Input */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">
                账号
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#A39E99]" />
                <input
                  type="text"
                  value={account}
                  onChange={e => { setAccount(e.target.value); setErrors(p => { const n = { ...p }; delete n.account; delete n.general; return n; }); }}
                  placeholder="请输入账号"
                  className={`h-11 w-full rounded-xl border bg-white py-0 pl-10 pr-4 text-sm text-[#2D2926] transition-all placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none ${errors.account ? 'border-[#C75C3A]' : 'border-[rgba(45,41,38,0.12)]'}`}
                />
              </div>
              {errors.account && <p className="mt-1 text-xs text-[#C75C3A]">{errors.account}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#2D2926]">
                密码
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#A39E99]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => { const n = { ...p }; delete n.password; delete n.general; return n; }); }}
                  placeholder="请输入密码"
                  className={`h-11 w-full rounded-xl border bg-white py-0 pl-10 pr-11 text-sm text-[#2D2926] transition-all placeholder:text-[#A39E99] focus:border-[#D4853C] focus:shadow-[0_0_0_3px_rgba(212,133,60,0.12)] focus:outline-none ${errors.password ? 'border-[#C75C3A]' : 'border-[rgba(45,41,38,0.12)]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A39E99] transition-colors hover:text-[#6B6560]"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-[#C75C3A]">{errors.password}</p>}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-[14px] bg-[#D4853C] text-base font-semibold text-white transition-all hover:bg-[#BF7532] hover:shadow-[0_2px_8px_rgba(212,133,60,0.30)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:pointer-events-none disabled:opacity-80"
            >
              {isLoading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                '登 录'
              )}
            </button>

            {/* Footer Row */}
            <div className="mt-1 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[#6B6560]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[rgba(45,41,38,0.12)] text-[#D4853C] accent-[#D4853C]"
                />
                记住我
              </label>
              <button
                type="button"
                className="text-xs text-[#D4853C] transition-colors hover:underline"
                onClick={() => alert('请联系管理员重置密码')}
              >
                忘记密码?
              </button>
            </div>
          </form>

          {/* Bottom hint */}
          <p className="mt-8 text-center text-xs text-[#A39E99]">
            首次使用? 联系管理员开通账号
          </p>

          {/* Demo credentials hint */}
          <div className="mt-4 rounded-xl bg-[rgba(45,41,38,0.03)] p-3 text-center">
            <p className="text-[11px] text-[#A39E99]">
              演示账号: admin / shop01 / staff01
            </p>
            <p className="mt-0.5 text-[11px] text-[#A39E99]">
              密码: 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
