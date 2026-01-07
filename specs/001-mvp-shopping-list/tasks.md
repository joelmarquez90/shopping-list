# Tasks: MVP Shopping List

**Input**: Design documents from `/specs/001-mvp-shopping-list/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, research.md, quickstart.md

**Tests**: Tests are NOT included as they were not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Next.js App Router (single project)
- **Source**: `src/` at repository root
- **Components**: `src/components/`
- **Data**: `src/data/`
- **Hooks**: `src/hooks/`
- **Types**: `src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Next.js 14+ project with TypeScript and App Router in repository root
- [ ] T002 [P] Configure Tailwind CSS 3.x with dark mode (class strategy) in tailwind.config.ts
- [ ] T003 [P] Configure TypeScript strict mode in tsconfig.json
- [ ] T004 [P] Create .gitignore with Node.js patterns
- [ ] T005 Setup globals.css with CSS variables for dark/light themes in src/app/globals.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Create Product and ProductState types in src/types/product.ts
- [ ] T007 [P] Create FilterType enum in src/types/product.ts
- [ ] T008 Create hardcoded products data array in src/data/products.ts
- [ ] T009 Create useProductState hook with state initialization in src/hooks/useProductState.ts
- [ ] T010 Create root layout with dark mode class and metadata in src/app/layout.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Ver Lista de Productos (Priority: P1)

**Goal**: Mostrar lista de productos con nombre, cantidad editable y link al supermercado

**Independent Test**: Abrir la aplicación y verificar que se muestra la lista de productos con todas las columnas

### Implementation for User Story 1

- [ ] T011 [US1] Create ProductRow component displaying product name, quantity, checkboxes in src/components/ProductRow.tsx
- [ ] T012 [US1] Create ProductList component that renders all ProductRow items in src/components/ProductList.tsx
- [ ] T013 [US1] Create main page that uses ProductList and useProductState in src/app/page.tsx
- [ ] T014 [US1] Style ProductList for mobile-first responsive layout (cards on mobile, table on desktop) in src/components/ProductList.tsx
- [ ] T015 [US1] Implement product name as external link opening in new tab in src/components/ProductRow.tsx

**Checkpoint**: User can see the full product list with names, quantities, and clickable links

---

## Phase 4: User Story 2 - Marcar Productos como "Hay" (Priority: P2)

**Goal**: Permitir marcar productos que ya se tienen en casa

**Independent Test**: Marcar checkbox "Hay" y verificar cambio visual del producto

### Implementation for User Story 2

- [ ] T016 [US2] Add toggleHay function to useProductState hook in src/hooks/useProductState.ts
- [ ] T017 [US2] Implement "Hay" checkbox with toggle handler in src/components/ProductRow.tsx
- [ ] T018 [US2] Add visual styling for products marked as "Hay" (opacity, strikethrough) in src/components/ProductRow.tsx

**Checkpoint**: User can mark/unmark products as "Hay" with visual feedback

---

## Phase 5: User Story 3 - Modificar Cantidad a Comprar (Priority: P3)

**Goal**: Permitir ajustar la cantidad de cada producto

**Independent Test**: Cambiar cantidad de un producto y verificar que el valor se actualiza

### Implementation for User Story 3

- [ ] T019 [US3] Create QuantityInput component with number validation in src/components/QuantityInput.tsx
- [ ] T020 [US3] Add updateQuantity function to useProductState hook in src/hooks/useProductState.ts
- [ ] T021 [US3] Integrate QuantityInput in ProductRow with change handler in src/components/ProductRow.tsx

**Checkpoint**: User can modify quantities with validation (0-99, numeric only)

---

## Phase 6: User Story 4 - Marcar Productos como "Comprado" (Priority: P4)

**Goal**: Permitir marcar productos como comprados

**Independent Test**: Marcar checkbox "Comprado" y verificar cambio visual

### Implementation for User Story 4

- [ ] T022 [US4] Add toggleComprado function to useProductState hook in src/hooks/useProductState.ts
- [ ] T023 [US4] Implement "Comprado" checkbox with toggle handler in src/components/ProductRow.tsx
- [ ] T024 [US4] Add visual styling for products marked as "Comprado" in src/components/ProductRow.tsx

**Checkpoint**: User can mark/unmark products as "Comprado" with visual feedback

---

## Phase 7: User Story 5 - Filtrar Lista por Estado (Priority: P5)

**Goal**: Filtrar lista para ver Todos, Pendientes, o Faltantes

**Independent Test**: Aplicar cada filtro y verificar que la lista muestra solo los productos correspondientes

### Implementation for User Story 5

- [ ] T025 [US5] Add getFilteredProducts function to useProductState hook in src/hooks/useProductState.ts
- [ ] T026 [US5] Create FilterBar component with three filter buttons (Todos/Pendientes/Faltantes) in src/components/FilterBar.tsx
- [ ] T027 [US5] Integrate FilterBar in main page with filter state in src/app/page.tsx
- [ ] T028 [US5] Connect filter selection to ProductList display in src/app/page.tsx

**Checkpoint**: User can filter the list by state with one click

---

## Phase 8: User Story 6 - Abrir Link del Producto (Priority: P6)

**Goal**: Abrir página del supermercado al hacer click en el nombre del producto

**Independent Test**: Click en producto con link y verificar que abre nueva pestaña

### Implementation for User Story 6

- [ ] T029 [US6] Handle products without URL showing plain text instead of link in src/components/ProductRow.tsx
- [ ] T030 [US6] Add hover styles for product links in dark mode in src/components/ProductRow.tsx

**Checkpoint**: Product links open in new tabs, products without links show as plain text

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T031 [P] Add empty state message when no products match filter in src/components/ProductList.tsx
- [ ] T032 [P] Add loading state skeleton during initial render in src/app/page.tsx
- [ ] T033 Ensure touch targets are minimum 44x44px for all interactive elements
- [ ] T034 [P] Add header with app title and dark mode toggle (optional) in src/app/layout.tsx
- [ ] T035 Verify responsive layout works on mobile (320px) and desktop (1920px)
- [ ] T036 Run quickstart.md validation - test complete workflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (P1): Required for visual context, but others can start in parallel
  - US2-US6: Can theoretically run in parallel after Phase 2
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - creates base UI structure
- **User Story 2 (P2)**: Foundation only - toggleHay is independent
- **User Story 3 (P3)**: Foundation only - quantity input is independent
- **User Story 4 (P4)**: Foundation only - toggleComprado is independent
- **User Story 5 (P5)**: Depends on US2 & US4 being functional (filter uses hay/comprado state)
- **User Story 6 (P6)**: Foundation only - link handling is independent

### Within Each User Story

- Hook functions before UI components that use them
- Base components before integration
- Core functionality before styling polish

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel
- **Phase 2**: T006, T007 can run in parallel (same file but independent types)
- **Phase 9**: T031, T032, T034 can run in parallel

---

## Parallel Example: Phase 2 Foundation

```bash
# Launch type definitions together:
Task: "Create Product and ProductState types in src/types/product.ts"
Task: "Create FilterType enum in src/types/product.ts"

# Then sequentially:
Task: "Create hardcoded products data array in src/data/products.ts"
Task: "Create useProductState hook in src/hooks/useProductState.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Ver Lista)
4. **STOP and VALIDATE**: Test that list displays correctly
5. Deploy/demo if ready - user can already see products!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Basic list visible (MVP!)
3. User Story 2 → Can mark "Hay"
4. User Story 3 → Can edit quantities
5. User Story 4 → Can mark "Comprado"
6. User Story 5 → Can filter list
7. User Story 6 → Links work properly
8. Polish → Production ready

### Recommended Order for Single Developer

Execute phases 1-9 sequentially. Within each phase:
1. Complete non-[P] tasks in order
2. [P] tasks can be batched if desired

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each completed phase
- Stop at any checkpoint to validate story independently
- All interactive elements must have 44x44px minimum touch targets (constitution requirement)
- Dark mode is the default and must be tested first
