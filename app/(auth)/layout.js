import "../globals.css";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-lg shadow-slate-200/50">
        {children}
      </div>
    </div>
  );
}
