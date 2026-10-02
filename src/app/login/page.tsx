import { LoginForm } from '@/components/LoginForm';
import { BarChart3, FileCheck, TrendingUp, Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-slate-950">
      {/* Left panel */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage:'linear-gradient(rgba(99,102,241,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.3) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        {/* Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg tracking-tight">DocuVault</p>
              <p className="text-blue-400/70 text-xs">Document Management System</p>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Enterprise Solution</p>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Manage Your<br />
              <span className="text-blue-400">Documents</span><br />
              Efficiently
            </h1>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-xs">
              Centralize your organization's documents with role-based access, audit trails, and secure file storage.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: FileCheck, label: 'Documents', value: 'Secured' },
              { icon: TrendingUp, label: 'Access', value: 'Tracked' },
              { icon: Shield, label: 'Roles', value: 'Managed' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-slate-900/5 border border-white/10 rounded-xl p-3 text-center">
                <Icon className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-white text-xs font-bold">{value}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">
          &copy; {new Date().getFullYear()} DocuVault. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">DocuVault</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-400 text-xs font-medium">Secure Portal</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Sign In</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the system</p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-slate-700 mt-8 md:hidden">
            &copy; {new Date().getFullYear()} DocuVault
          </p>
        </div>
      </div>
    </main>
  );
}

