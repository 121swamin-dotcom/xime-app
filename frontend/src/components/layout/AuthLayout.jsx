export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 via-brand-500 to-slate-700
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-white/15 backdrop-blur-sm mb-4">
            <span className="text-white font-mono font-bold text-xl">XI</span>
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            XIME Chennai
          </h1>
          <p className="text-white/70 text-sm mt-1">IT &amp; Analytics Domain</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {title && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
              {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
