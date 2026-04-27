export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CC0000] via-[#990000] to-[#660000]
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-14 rounded-xl
                          bg-white mb-4 overflow-hidden p-2">
            <img src="/xime_logo.png" alt="XIME" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">XIME Chennai</h1>
          <p className="text-white/75 text-sm mt-1 font-medium">IT &amp; Analytics Domain</p>
        </div>
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
