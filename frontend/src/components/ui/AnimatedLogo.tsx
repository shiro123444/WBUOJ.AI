export const AnimatedLogo = () => {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <style>{`
        .logo-loader {
          --path: #2f3545;
          --dot: #06b6d4; /* Cyan-500 */
          --duration: 3s;
          width: 32px;
          height: 32px;
          position: relative;
        }

        .dark .logo-loader {
          --path: #e5e7eb; /* Gray-200 */
          --dot: #22d3ee; /* Cyan-400 */
        }

        .logo-loader:before {
          content: "";
          width: 4px;
          height: 4px;
          border-radius: 50%;
          position: absolute;
          display: block;
          background: var(--dot);
          top: 28px;
          left: 14px;
          transform: translate(-14px, -14px);
          animation: dotRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .logo-loader svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .logo-loader svg rect {
          fill: none;
          stroke: var(--path);
          stroke-width: 8px;
          stroke-linejoin: round;
          stroke-linecap: round;
          stroke-dasharray: 192 64 192 64;
          stroke-dashoffset: 0;
          animation: pathRect 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        @keyframes pathRect {
          25% { stroke-dashoffset: 64; }
          50% { stroke-dashoffset: 128; }
          75% { stroke-dashoffset: 192; }
          100% { stroke-dashoffset: 256; }
        }

        @keyframes dotRect {
          25% { transform: translate(0, 0); }
          50% { transform: translate(14px, -14px); }
          75% { transform: translate(0, -28px); }
          100% { transform: translate(-14px, -14px); }
        }
      `}</style>
      <div className="logo-loader">
        <svg viewBox="0 0 80 80">
          <rect height={64} width={64} y={8} x={8} />
        </svg>
      </div>
    </div>
  );
};
