import { LoginForm } from '@/components/LoginForm';
import { FileCheck2, ShieldCheck, Users } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — gradient */}
      <div className="relative hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 flex-col justify-between overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 left-1/4 w-96 h-96 rounded-full bg-white/5" />
          {/* Floating pills */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: `${40 + i * 20}px`,
                height: `${14 + i * 4}px`,
                top: `${15 + i * 13}%`,
                left: `${5 + i * 10}%`,
                transform: `rotate(${-30 + i * 10}deg)`,
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">DocuVault</span>
          </div>
        </div>

        {/* Center text */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Secure Document<br />Management System
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Store, organize, and manage your organization's documents securely in one place.
          </p>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              { icon: ShieldCheck, text: 'Role-based access control' },
              { icon: FileCheck2, text: 'Secure file storage & preview' },
              { icon: Users, text: 'Team collaboration & audit logs' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          &copy; {new Date().getFullYear()} DocuVault. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 p-8 md:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-lg">DocuVault</span>
          </div>

          <div className="mb-8">
            <p className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-2">
              USER LOGIN
            </p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to access your documents</p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-slate-400 mt-8 md:hidden">
            &copy; {new Date().getFullYear()} DocuVault
          </p>
        </div>
      </div>
    </main>
  );
}
