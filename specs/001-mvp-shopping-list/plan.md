# Implementation Plan: MVP Shopping List

**Branch**: `001-mvp-shopping-list` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mvp-shopping-list/spec.md`

## Summary

Desarrollar una aplicación web MVP que reemplace el workflow actual de Google Spreadsheets para gestión de lista de compras mensual. La aplicación permitirá visualizar productos hardcodeados, marcar disponibilidad ("Hay"), ajustar cantidades, marcar como comprado, y filtrar la lista por estado. Sin autenticación ni persistencia entre sesiones para esta versión inicial.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 14+ (App Router), Tailwind CSS 3.x, React 18+
**Storage**: N/A (datos hardcodeados en código, estado en memoria durante sesión)
**Testing**: Jest + React Testing Library (opcional para MVP)
**Target Platform**: Web (desktop + mobile browsers)
**Project Type**: Web application (Next.js single project)
**Performance Goals**: FCP < 1.5s, TTI < 3s on 4G (per constitution)
**Constraints**: Bundle size < 200KB gzipped per route, dark mode required
**Scale/Scope**: Single user, ~30-50 productos, 1 página principal

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Responsive Design | PASS | Lista será mobile-first, checkboxes con touch targets 44x44px |
| II. Dark Mode by Default | PASS | Tailwind dark mode config, CSS variables para temas |
| III. Firebase-Centric Architecture | EXEMPT | MVP sin auth/persistencia - Firebase se agregará en iteración futura |
| IV. Data Integrity & Price Tracking | EXEMPT | MVP sin tracking de precios - feature futura |
| V. Clean UI/UX Design | PASS | Diseño minimalista tipo spreadsheet, estados de carga/vacío |
| VI. Extensibility for Future Integrations | PASS | Estructura de datos preparada para exportación futura |

**Gate Result**: PASS (2 principles exempt by MVP scope, 4 principles compliant)

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-shopping-list/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API for MVP)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx           # Root layout con dark mode
│   ├── page.tsx             # Página principal con lista
│   └── globals.css          # Estilos globales + CSS variables
├── components/
│   ├── ProductList.tsx      # Componente lista de productos
│   ├── ProductRow.tsx       # Fila individual de producto
│   ├── FilterBar.tsx        # Barra de filtros
│   └── QuantityInput.tsx    # Input numérico para cantidad
├── data/
│   └── products.ts          # Lista hardcodeada de productos
├── hooks/
│   └── useProductState.ts   # Hook para manejo de estado
└── types/
    └── product.ts           # Tipos TypeScript

public/
└── (assets si necesarios)

tailwind.config.ts           # Config Tailwind con dark mode
next.config.js               # Config Next.js
tsconfig.json                # TypeScript strict mode
```

**Structure Decision**: Next.js App Router con estructura plana para MVP. Sin separación backend/frontend ya que no hay API ni persistencia. Los productos se cargan desde archivo TypeScript hardcodeado.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Firebase exempt | MVP sin auth/persistencia | Se agregará en siguiente iteración cuando se implemente login |
| Price tracking exempt | MVP foco en workflow básico | Feature de precios requiere OCR/AI que excede scope MVP |

