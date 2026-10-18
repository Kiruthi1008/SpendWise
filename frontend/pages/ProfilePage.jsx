import React, { useState } from 'react';
import {
  UserCheck,
  User,
  AtSign,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    gender: user?.gender || 'Male',
    dob: user?.dob || '2000-01-01',
  });

  const handleStartEdit = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        dob: user.dob,
      });
    }
    setStatusMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.gender || !formData.dob) {
      setStatusMessage({ type: 'error', text: 'All profile fields are required.' });
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        gender: formData.gender,
        dob: formData.dob,
      });
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} yrs old` : 'N/A';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Profile Hero Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-sky-500/25 ring-4 ring-sky-100">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-black border border-sky-200">
                  Verified
                </span>
              </div>
              <p className="text-sm font-extrabold text-sky-600 flex items-center gap-1 mt-0.5">
                <AtSign className="w-3.5 h-3.5" />
                <span>{user?.username}</span>
              </p>
              <p className="text-xs font-medium text-slate-400 mt-1">
                Registered on {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>

          <div>
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-sky-200 text-sky-700 hover:bg-sky-50 font-bold text-xs transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs border ${
            statusMessage.type === 'success'
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Profile Details Card in White & Sky Blue */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5">
        <div className="flex items-center justify-between pb-4 border-b border-sky-100 mb-6">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-500" />
              Registration Profile Record
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Personal registration fields captured during onboarding.
            </p>
          </div>
          {isEditing && (
            <span className="text-xs font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200">
              Editing Active
            </span>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Unique Username (Permanent)
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2.5 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 bg-sky-50/30 border border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-sky-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2.5 rounded-xl border border-sky-200 text-sky-700 font-bold text-xs hover:bg-sky-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Full Name
              </span>
              <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-500" />
                {user?.name}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Unique Username
              </span>
              <p className="text-sm font-black text-sky-600 flex items-center gap-2">
                <AtSign className="w-4 h-4 text-sky-500" />
                {user?.username}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </span>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2 truncate">
                <Mail className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Mobile Number
              </span>
              <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-500" />
                {user?.mobile}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Gender
              </span>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-500" />
                {user?.gender}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Date of Birth (DOB)
              </span>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" />
                {user?.dob} ({calculateAge(user?.dob)})
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Security info banner */}
      <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm shadow-sky-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-sky-500" />
            Security & Authentication Protocol
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Dual identifier login enabled via registered Email ID or Mobile Number.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50 px-3.5 py-2 rounded-2xl border border-sky-200">
          <CheckCircle2 className="w-4 h-4 text-sky-500" />
          <span>Active Session</span>
        </div>
      </div>
    </div>
  );
};
