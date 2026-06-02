// Favicon de carrito de supermercado, dibujado con SVG (sin assets externos).
// Se prerenderiza en build y se sirve con caché inmutable para cargar al instante.
export const dynamic = 'force-static'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#22c55e"/>
  <g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5.5 8H8.5L9.8 11H26L23.8 19.5H12.2L9.8 11"/>
    <circle cx="12.5" cy="24" r="1.8"/>
    <circle cx="22" cy="24" r="1.8"/>
  </g>
</svg>`

export function GET() {
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
