# Quickstart: MVP Shopping List

**Branch**: `001-mvp-shopping-list` | **Date**: 2026-01-06

## Prerequisites

- Node.js 18.17+ (LTS recommended)
- npm 9+ or pnpm 8+
- Git

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/joelmarquez90/shopping-list.git
cd shopping-list
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Workflow

1. **Review Products**: Al abrir la app, verás la lista completa de productos
2. **Mark "Hay"**: Marca los productos que ya tienes en casa
3. **Adjust Quantities**: Modifica las cantidades según lo que necesites este mes
4. **Filter to Pending**: Usa el filtro "Pendientes" para ver solo lo que debes comprar
5. **Open Product Links**: Click en el nombre del producto para abrir la página del super
6. **Mark "Comprado"**: Marca cada producto después de agregarlo al carrito
7. **Check Missing**: Usa el filtro "Faltantes" para ver qué productos no pudiste comprar

### Filters

| Filter | Shows |
|--------|-------|
| Todos | Todos los productos |
| Pendientes | Productos sin marcar "Hay" |
| Faltantes | Productos sin "Hay" y sin "Comprado" |

### Important Notes

- Los cambios NO se guardan entre sesiones
- Al refrescar la página, todo vuelve al estado inicial
- Los links abren en nueva pestaña

## Development

### Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── data/            # Hardcoded product data
├── hooks/           # Custom React hooks
└── types/           # TypeScript definitions
```

### Key Files

| File | Purpose |
|------|---------|
| `src/data/products.ts` | Lista de productos hardcodeada |
| `src/hooks/useProductState.ts` | Manejo de estado de productos |
| `src/components/ProductList.tsx` | Componente principal de la lista |
| `src/components/FilterBar.tsx` | Controles de filtrado |

### Adding Products

Edit `src/data/products.ts`:

```typescript
export const products: Product[] = [
  {
    id: "unique-id",
    name: "Product Name",
    url: "https://www.changomas.com.ar/...",  // optional
    defaultQuantity: 1
  },
  // ... more products
]
```

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Build & Deploy

### Build

```bash
npm run build
```

### Deploy to Vercel

```bash
npx vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Troubleshooting

### Page not loading
- Verify Node.js version: `node --version` (should be 18.17+)
- Clear `.next` folder: `rm -rf .next && npm run dev`

### Dark mode not working
- Check browser supports `prefers-color-scheme`
- Verify `dark` class on `<html>` element

### Links not opening
- Check browser popup blocker settings
- Verify URLs in `products.ts` are valid
