// Film grain overlay — sits ABOVE all content (z-[100]), pointer-events-none,
// screen blend so it's visible on dark backgrounds.
const GRAIN_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{
        backgroundImage: GRAIN_URI,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
        opacity: 0.08,
        mixBlendMode: "screen",
      }}
    />
  );
}