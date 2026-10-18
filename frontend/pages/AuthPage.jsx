import React, { useState } from 'react';
import {
  Wallet,
  User,
  AtSign,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { PWAInstallButton } from '../components/PWAInstallButton.jsx';

export const AuthPage = () => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Login form state (identifier supports email OR mobile OR username)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [regData, setRegData] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    gender: 'Male',
    dob: '2000-01-01',
    password: '',
    confirmPassword: '',
  });

  const [usernameStatus, setUsernameStatus] = useState('idle');

  const checkUsername = async (u) => {
    if (!u.trim() || u.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await api.checkUsername(u);
      setUsernameStatus(res.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Please enter both your Email / Mobile Number and your password.');
      return;
    }

    try {
      setLoading(true);
      await login(loginIdentifier.trim(), loginPassword);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const { name, username, email, mobile, gender, dob, password, confirmPassword } = regData;

    if (!name.trim() || !username.trim() || !email.trim() || !mobile.trim() || !gender || !dob || !password) {
      setErrorMessage('Please fill out all registration fields.');
      return;
    }

    if (usernameStatus === 'taken') {
      setErrorMessage('Please pick a unique username before proceeding.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check again.');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        gender,
        dob,
        password,
      });
      setSuccessMessage('Account created successfully! Redirecting...');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setLoginIdentifier('alex.morgan@example.com');
    setLoginPassword('Password123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-white to-sky-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-sky-200/40 via-sky-100/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-0 w-80 h-80 bg-sky-300/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / PWA Action */}
      <div className="absolute top-4 right-4 z-20">
        <PWAInstallButton compact />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 text-white shadow-lg shadow-sky-500/25 mb-4 ring-4 ring-sky-100">
          <Wallet className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">SpendWise</h1>
        <p className="mt-1 text-sm font-semibold text-sky-600">Personal Expense & Income Intelligence SPA</p>

        {/* Tab Switcher */}
        <div className="mt-6 p-1 bg-sky-50 rounded-2xl border border-sky-100 grid grid-cols-2 max-w-xs mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(true);
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isLoginMode
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(false);
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isLoginMode
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-600 hover:text-sky-700'
            }`}
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Main Form Container in White with Sky Blue Accents */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-sky-500/5 rounded-3xl border border-sky-100">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {isLoginMode ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email ID or Mobile Number
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="alex.morgan@example.com or +1987654321"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  Accepts either registered email ID or mobile number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    required
                    className="block w-full pl-10 pr-10 py-2.5 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-sky-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-sky-500/25 bg-sky-500 hover:bg-sky-600 active:scale-[0.99] font-black text-white text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In to SpendWise</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Demo Account Fill Card */}
              <div className="pt-4 border-t border-sky-100">
                <div className="p-3.5 bg-sky-50/60 rounded-2xl border border-sky-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      Quick Demo Sign-In
                    </span>
                    <button
                      type="button"
                      onClick={fillDemoAccount}
                      className="text-sky-600 hover:text-sky-700 font-extrabold hover:underline cursor-pointer"
                    >
                      Fill Demo Credentials
                    </button>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Pre-populated with income, expense, and to-do datasets.
                  </p>
                </div>
              </div>
            </form>
          ) : (
            /* ================= REGISTRATION FORM ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="e.g. Sarah Connor"
                    required
                    className="block w-full pl-9 pr-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Unique Username */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Unique Username
                  </label>
                  {usernameStatus === 'available' && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Available
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Already taken
                    </span>
                  )}
                </div>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-500">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regData.username}
                    onChange={(e) => {
                      const u = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                      setRegData({ ...regData, username: u });
                      checkUsername(u);
                    }}
                    placeholder="e.g. sconnor"
                    required
                    className="block w-full pl-9 pr-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email ID
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="sarah@example.com"
                    required
                    className="block w-full pl-9 pr-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sky-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={regData.mobile}
                    onChange={(e) => setRegData({ ...regData, mobile: e.target.value })}
                    placeholder="+1234567890"
                    required
                    className="block w-full pl-9 pr-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Gender & DOB 2-column */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={regData.gender}
                    onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                    className="block w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={regData.dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                    required
                    className="block w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="Min 6 chars"
                    required
                    className="block w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    placeholder="Retype"
                    required
                    className="block w-full px-3 py-2 bg-sky-50/30 border border-sky-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-sky-500/25 bg-sky-500 hover:bg-sky-600 active:scale-[0.99] font-black text-white text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Feature Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-sky-600">
            <ShieldCheck className="w-4 h-4 text-sky-500" /> Bcrypt Security
          </span>
          <span className="flex items-center gap-1.5 text-sky-600">
            <TrendingUp className="w-4 h-4 text-sky-500" /> Real-time Analytics
          </span>
        </div>
      </div>
    </div>
  );
};
