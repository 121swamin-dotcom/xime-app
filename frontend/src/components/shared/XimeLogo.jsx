// Logo served from /public/xime_logo.png — deployed with Vercel
export function XimeLogo({ className = '' }) {
  return (
    <img
      src="/xime_logo.png"
      alt="XIME"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
