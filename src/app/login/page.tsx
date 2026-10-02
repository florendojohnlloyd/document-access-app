import { LoginForm } from '@/components/LoginForm';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-light/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-primary shadow-lg shadow-teal-primary/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DocuVault</h1>
          <p className="text-slate-400 text-sm mt-1">Secure Document Management</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to your account to continue</p>
          </div>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          &copy; {new Date().getFullYear()} DocuVault. All rights reserved.
        </p>
      </div>
    </main>
  );
}
