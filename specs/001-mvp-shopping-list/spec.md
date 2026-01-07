# Feature Specification: MVP Shopping List

**Feature Branch**: `001-mvp-shopping-list`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "MVP para reemplazar workflow de Google Spreadsheets con lista de compras mensual"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver Lista de Productos (Priority: P1)

Como usuario, quiero ver una lista de todos los productos disponibles con su nombre y cantidad sugerida para poder revisar qué necesito comprar este mes.

**Why this priority**: Es la funcionalidad base sobre la cual se construyen todas las demás interacciones. Sin ver la lista, no hay aplicación.

**Independent Test**: Abrir la aplicación y verificar que se muestra una lista de productos con nombre, cantidad editable y link al supermercado.

**Acceptance Scenarios**:

1. **Given** la aplicación está cargada, **When** el usuario accede a la página principal, **Then** ve una lista de productos con columnas: Artículo, Cantidad, Hay, Comprado
2. **Given** la lista de productos está visible, **When** el usuario observa un producto, **Then** puede ver el nombre del producto como link clickeable que abre la página del supermercado
3. **Given** la lista está cargada, **When** el usuario revisa la columna Cantidad, **Then** cada producto muestra un valor numérico editable (default según datos hardcodeados)

---

### User Story 2 - Marcar Productos como "Hay" (Priority: P2)

Como usuario, quiero poder marcar productos que ya tengo en casa para excluirlos de mi lista de compras y ver solo lo que realmente necesito.

**Why this priority**: Permite filtrar la lista para enfocarse solo en lo necesario, que es el workflow principal del usuario.

**Independent Test**: Marcar varios productos como "Hay" y verificar que al filtrar solo quedan los productos sin marcar.

**Acceptance Scenarios**:

1. **Given** un producto está en la lista, **When** el usuario marca el checkbox "Hay", **Then** el producto queda visualmente indicado como que no necesita comprarse
2. **Given** varios productos están marcados como "Hay", **When** el usuario aplica el filtro de "Pendientes", **Then** solo se muestran los productos que NO tienen "Hay" marcado
3. **Given** un producto está marcado como "Hay", **When** el usuario desmarca el checkbox, **Then** el producto vuelve a aparecer en la lista filtrada de pendientes

---

### User Story 3 - Modificar Cantidad a Comprar (Priority: P3)

Como usuario, quiero poder ajustar la cantidad de cada producto según lo que necesito este mes.

**Why this priority**: Permite personalizar la lista según las necesidades del mes actual.

**Independent Test**: Cambiar la cantidad de un producto y verificar que el nuevo valor se refleja en la interfaz.

**Acceptance Scenarios**:

1. **Given** un producto tiene cantidad 2, **When** el usuario cambia el valor a 4, **Then** la cantidad mostrada se actualiza a 4
2. **Given** un producto tiene cantidad, **When** el usuario borra el valor y lo deja vacío, **Then** se interpreta como 0 o sin cantidad especificada
3. **Given** el usuario modifica varias cantidades, **When** revisa la lista, **Then** todas las cantidades modificadas persisten durante la sesión

---

### User Story 4 - Marcar Productos como "Comprado" (Priority: P4)

Como usuario, quiero marcar los productos que efectivamente pude agregar al carrito del supermercado para llevar control de mi progreso.

**Why this priority**: Permite trackear qué productos ya fueron procesados durante la sesión de compra.

**Independent Test**: Marcar productos como comprados y verificar que el estado se refleja visualmente.

**Acceptance Scenarios**:

1. **Given** un producto está pendiente de comprar, **When** el usuario marca el checkbox "Comprado", **Then** el producto queda visualmente indicado como comprado
2. **Given** varios productos están marcados como "Comprado", **When** el usuario aplica el filtro de "Faltantes", **Then** solo se muestran productos que NO tienen "Hay" y NO tienen "Comprado"
3. **Given** un producto está marcado como "Comprado", **When** el usuario desmarca el checkbox, **Then** el producto vuelve a la lista de pendientes

---

### User Story 5 - Filtrar Lista por Estado (Priority: P5)

Como usuario, quiero filtrar la lista para ver solo los productos pendientes o solo los que me faltaron comprar.

**Why this priority**: Replica la funcionalidad clave del filtro de Google Spreadsheets que permite enfocarse en subconjuntos específicos.

**Independent Test**: Aplicar diferentes filtros y verificar que la lista muestra solo los productos correspondientes.

**Acceptance Scenarios**:

1. **Given** la lista tiene productos en varios estados, **When** el usuario selecciona "Ver todos", **Then** se muestran todos los productos sin filtrar
2. **Given** la lista tiene productos en varios estados, **When** el usuario selecciona "Pendientes" (sin "Hay"), **Then** solo se muestran productos que necesitan comprarse
3. **Given** la lista tiene productos en varios estados, **When** el usuario selecciona "Faltantes" (sin "Hay" y sin "Comprado"), **Then** solo se muestran productos que no pudieron comprarse en el super

---

### User Story 6 - Abrir Link del Producto (Priority: P6)

Como usuario, quiero poder hacer click en el nombre del producto para abrir la página del supermercado y agregarlo al carrito.

**Why this priority**: Facilita el workflow de agregar productos al carrito sin copiar/pegar URLs.

**Independent Test**: Hacer click en un producto y verificar que se abre la página correspondiente del supermercado.

**Acceptance Scenarios**:

1. **Given** un producto tiene un link asociado, **When** el usuario hace click en el nombre, **Then** se abre una nueva pestaña con la página del producto en el supermercado
2. **Given** un producto no tiene link asociado, **When** el usuario ve el producto, **Then** el nombre se muestra como texto plano (no clickeable)

---

### Edge Cases

- **Lista vacía**: Si no hay productos hardcodeados, mostrar un mensaje indicando que no hay productos configurados
- **Cantidad inválida**: Si el usuario ingresa un valor no numérico, ignorar la entrada o revertir al valor anterior
- **Link roto**: Si el link del supermercado no funciona, el usuario simplemente verá un error 404 en la nueva pestaña (fuera del control de la app)
- **Sesión perdida**: Al refrescar la página, todos los estados (Hay, Comprado, Cantidad) vuelven a sus valores por defecto (comportamiento esperado para MVP)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar una lista de productos con las columnas: Artículo (nombre con link), Cantidad, Hay (checkbox), Comprado (checkbox)
- **FR-002**: El sistema DEBE permitir editar la cantidad de cada producto mediante un campo numérico
- **FR-003**: El sistema DEBE permitir marcar/desmarcar cada producto como "Hay" mediante checkbox
- **FR-004**: El sistema DEBE permitir marcar/desmarcar cada producto como "Comprado" mediante checkbox
- **FR-005**: El sistema DEBE soportar tres modos de filtrado: "Todos", "Pendientes" (sin Hay), "Faltantes" (sin Hay y sin Comprado)
- **FR-006**: El sistema DEBE abrir el link del producto en una nueva pestaña al hacer click en el nombre
- **FR-007**: El sistema DEBE funcionar sin autenticación ni persistencia entre sesiones
- **FR-008**: El sistema DEBE cargar productos desde una lista hardcodeada en el código
- **FR-009**: El sistema DEBE ser responsive y funcionar correctamente en dispositivos móviles y desktop
- **FR-010**: El sistema DEBE soportar dark mode por defecto según la constitución del proyecto

### Key Entities

- **Producto**: Representa un artículo de la lista de compras. Atributos: nombre (string), link al supermercado (URL opcional), cantidad por defecto (número)
- **Estado del Producto** (en sesión): Cantidad actual (número), marcado como "Hay" (boolean), marcado como "Comprado" (boolean)

### Assumptions

- Los productos hardcodeados incluirán aproximadamente 30-50 items típicos de una lista de compras mensual
- El supermercado de referencia es "Chango Más" (según las imágenes proporcionadas)
- La aplicación no requiere funcionar offline
- El orden de los productos en la lista será el orden definido en el hardcode
- No se requiere categorización de productos para el MVP

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario puede completar el flujo completo de revisión de lista (marcar "Hay" en productos existentes) en menos de 5 minutos para una lista de 30 productos
- **SC-002**: El usuario puede filtrar y ver solo productos pendientes con un solo click
- **SC-003**: El usuario puede abrir el link de un producto y marcarlo como comprado en menos de 10 segundos por producto
- **SC-004**: La aplicación carga completamente en menos de 3 segundos en conexión 4G
- **SC-005**: El usuario puede usar todas las funcionalidades tanto en móvil como en desktop sin degradación de experiencia
- **SC-006**: El filtro de "Faltantes" permite identificar inmediatamente qué productos no pudieron comprarse en el super
