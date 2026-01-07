# Research: MVP Shopping List

**Branch**: `001-mvp-shopping-list` | **Date**: 2026-01-06

## Research Summary

Este documento consolida las decisiones técnicas y patrones a utilizar para el MVP de la aplicación de lista de compras.

---

## 1. Next.js App Router Setup

**Decision**: Usar Next.js 14+ con App Router

**Rationale**:
- App Router es el estándar moderno de Next.js con mejor soporte para Server Components
- Para este MVP, usaremos principalmente Client Components debido a la interactividad requerida
- La estructura de carpetas `app/` es más intuitiva y escalable

**Alternatives Considered**:
- Pages Router: Descartado por ser legacy y no recibir nuevas features
- Vite + React: Descartado para mantener consistencia con la constitución (Next.js mandatorio)

---

## 2. State Management Pattern

**Decision**: React useState + Custom Hook (`useProductState`)

**Rationale**:
- MVP simple no requiere state management library externa
- Un custom hook encapsula toda la lógica de estado de productos
- Fácil de migrar a Zustand/Redux si se necesita en el futuro
- El estado se reinicia al refrescar (comportamiento esperado para MVP)

**Alternatives Considered**:
- Zustand: Overkill para MVP sin persistencia
- Redux: Demasiado boilerplate para scope actual
- Context API: Innecesario sin prop drilling profundo

**Implementation Pattern**:
```typescript
// useProductState.ts
const useProductState = (initialProducts: Product[]) => {
  const [products, setProducts] = useState<ProductState[]>(...)

  const toggleHay = (id: string) => {...}
  const toggleComprado = (id: string) => {...}
  const updateQuantity = (id: string, qty: number) => {...}
  const getFilteredProducts = (filter: FilterType) => {...}

  return { products, toggleHay, toggleComprado, updateQuantity, getFilteredProducts }
}
```

---

## 3. Dark Mode Implementation

**Decision**: Tailwind CSS `class` strategy con CSS variables

**Rationale**:
- Tailwind soporta dark mode nativo con prefijo `dark:`
- CSS variables permiten theming consistente
- `class` strategy permite control programático del tema
- Dark mode como default según constitución

**Implementation Pattern**:
```typescript
// tailwind.config.ts
darkMode: 'class'

// globals.css
:root {
  --background: 255 255 255;
  --foreground: 0 0 0;
}
.dark {
  --background: 10 10 10;
  --foreground: 255 255 255;
}

// layout.tsx
<html className="dark">
```

---

## 4. Responsive Table/List Design

**Decision**: Diseño mobile-first con cards en móvil, tabla en desktop

**Rationale**:
- Las tablas tradicionales son difíciles de usar en móvil
- Cards apiladas en móvil son más touch-friendly
- En desktop, el formato tabla es más eficiente para ~50 items
- Transición suave con Tailwind breakpoints

**Implementation Pattern**:
```typescript
// Mobile: Cards apiladas
// Desktop: Grid tipo tabla
<div className="grid grid-cols-1 md:grid-cols-[1fr,80px,60px,60px] gap-2 md:gap-0">
```

**Mobile Layout** (< 768px):
```
┌─────────────────────────┐
│ Producto Name      [link]│
│ Cantidad: [___]         │
│ [x] Hay    [x] Comprado │
└─────────────────────────┘
```

**Desktop Layout** (>= 768px):
```
| Artículo          | Cantidad | Hay | Comprado |
|-------------------|----------|-----|----------|
| Producto (link)   |    4     | [x] |   [ ]    |
```

---

## 5. Filter Implementation

**Decision**: Enum de filtros con función de filtrado puro

**Rationale**:
- Tres estados claros: ALL, PENDING, MISSING
- Función pura facilita testing
- UI simple con tabs o segmented control

**Filter Logic**:
```typescript
type FilterType = 'ALL' | 'PENDING' | 'MISSING'

const filterProducts = (products: ProductState[], filter: FilterType) => {
  switch (filter) {
    case 'ALL': return products
    case 'PENDING': return products.filter(p => !p.hay)
    case 'MISSING': return products.filter(p => !p.hay && !p.comprado)
  }
}
```

---

## 6. Product Data Structure

**Decision**: Separar datos base (hardcoded) de estado de sesión

**Rationale**:
- Datos base son inmutables (nombre, link, cantidad default)
- Estado de sesión es mutable (hay, comprado, cantidad actual)
- Facilita futura migración a Firestore

**Data Types**:
```typescript
// Datos base (hardcoded)
interface Product {
  id: string
  name: string
  url?: string
  defaultQuantity: number
}

// Estado en sesión
interface ProductState extends Product {
  quantity: number
  hay: boolean
  comprado: boolean
}
```

---

## 7. Touch Target Sizing

**Decision**: Checkboxes y controles con mínimo 44x44px

**Rationale**:
- Apple HIG y Material Design recomiendan 44-48px
- Constitución requiere touch targets adecuados
- Importante para uso en supermercado con una mano

**Implementation**:
```typescript
<button className="min-h-[44px] min-w-[44px] flex items-center justify-center">
  <input type="checkbox" className="h-5 w-5" />
</button>
```

---

## 8. External Links Handling

**Decision**: `target="_blank"` con `rel="noopener noreferrer"`

**Rationale**:
- Links a Chango Más deben abrir en nueva pestaña
- Security best practice para links externos
- Usuario mantiene contexto de la app

**Implementation**:
```typescript
<a
  href={product.url}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-400 hover:underline"
>
  {product.name}
</a>
```

---

## 9. Empty/Loading States

**Decision**: Componentes dedicados para estados vacío y carga

**Rationale**:
- Constitución requiere diseño de empty states
- Mejora UX durante carga inicial
- Lista vacía debe mostrar mensaje claro

**States to Handle**:
- Loading: Skeleton o spinner durante carga inicial (mínimo para datos hardcoded)
- Empty list: "No hay productos configurados"
- Empty filter result: "No hay productos que coincidan con el filtro"

---

## Key Decisions Summary

| Topic | Decision | Key Reason |
|-------|----------|------------|
| Framework | Next.js 14 App Router | Constitución mandatoria |
| State | useState + custom hook | Simplicidad MVP |
| Dark Mode | Tailwind class strategy | Control + default dark |
| Layout | Cards mobile / Table desktop | Mobile-first UX |
| Filters | Enum + pure function | Claridad + testability |
| Data | Base + Session state split | Future Firestore migration |
| Touch | 44px minimum targets | Mobile usability |
| Links | New tab with security attrs | Context preservation |
