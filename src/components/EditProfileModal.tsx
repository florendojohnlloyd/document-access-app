'use client';

import { useState } from 'react';
import { X, User, Lock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface EditProfileModalProps {
  profile: Profile;
  onSaved: (updated: Profile) => void;
  onClose: () => void;
}

export function EditProfileModal({ profile, onSaved, onClose }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inputClass = cn(
    'w-full px-3 py-2.5 rounded-lg border text-sm',
    'bg-slate-50 text-slate-900 border-slate-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'transition-colors'
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    // super_admin can always edit name; admin and user locked after first set
    if (profile.role !== 'super_admin' && profile.name_locked) {
      setError('Your name is locked and cannot be changed.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });
      const data = await res.json() as Profile | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Failed to update profile.');
      } else {
        setSuccess('Profile updated successfully!');
        onSaved(data as Profile);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!currentPassword) { setError('Please enter your current password.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json() as { success: boolean } | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data ? data.error : null) ?? 'Failed to change password.');
      } else {
        setSuccess('Password changed successfully!');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Edit Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">@{profile.username}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setTab('profile'); setError(''); setSuccess(''); }}
            className={cn('flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors', tab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700')}
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={() => { setTab('password'); setError(''); setSuccess(''); }}
            className={cn('flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors', tab === 'password' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700')}
          >
            <Lock className="w-4 h-4" /> Password
          </button>
        </div>

        <div className="p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold uppercase">
                {(profile.full_name ?? profile.username).charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{profile.full_name ?? profile.username}</p>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
              profile.role === 'super_admin' ? 'bg-amber-100 text-amber-600' :
              profile.role === 'admin' ? 'bg-purple-100 text-purple-600' :
              'bg-blue-100 text-blue-600'
            )}>
              {profile.role === 'super_admin' ? '⭐ Super Admin' : profile.role === 'admin' ? '🛡 Admin' : 'User'}
            </span>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                <input value={profile.username} disabled className={cn(inputClass, 'opacity-50 cursor-not-allowed')} />
                <p className="text-xs text-slate-400 mt-1">Username cannot be changed.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={profile.role !== 'super_admin' && profile.name_locked}
                  className={cn(inputClass, profile.role !== 'super_admin' && profile.name_locked && 'opacity-50 cursor-not-allowed')}
                />
                {profile.role !== 'super_admin' && profile.name_locked && (
                  <p className="text-xs text-amber-500 mt-1">⚠ Name is locked and cannot be changed.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || (profile.role !== 'super_admin' && profile.name_locked)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : <Save className="w-4 h-4" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Password tab */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className={inputClass} />
              </div>
              <button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : <Lock className="w-4 h-4" />}
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
