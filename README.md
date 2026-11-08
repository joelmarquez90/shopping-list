# Lista de Compras

Aplicación de compras mensuales con Next.js 16, React 19, TypeScript 6 y Tailwind 4. Incluye acceso con Google, catálogo administrable en Firestore, estado por usuario y automatización local opcional de MasOnline y Mercado Libre.

## Desarrollo

Requiere Node 24 (>=24.12; versión fijada en `.nvmrc`).

```bash
nvm use
npm ci
cp .env.local.example .env.local
# Completar la configuración pública de Firebase y la lista de emails permitidos.
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El servidor escucha únicamente en loopback. Para un despliegue web, configurar explícitamente el binding y el proxy de la plataforma; la automatización sigue siendo una función local.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
npm audit
```

Las fuentes Geist están instaladas localmente: el build no descarga fuentes de Google. Sin configuración de Firebase, la app muestra el acceso y los errores de configuración sin fallar al compilar.

## Datos y permisos

El catálogo se carga de Firestore; `src/data/products.ts` conserva el catálogo inicial para la migración. Los productos son públicos por diseño. Las reglas restringen las modificaciones del catálogo al email administrador verificado configurado en `firestore.rules`. `NEXT_PUBLIC_ALLOWED_EMAILS` controla el acceso a la interfaz; no reemplaza las reglas de autorización del backend.

El estado de compras se guarda en `shoppingState/{uid}` y solo su propietario puede leerlo o modificarlo. Los filtros son Todos, Pendientes (`!hay`) y Faltantes (`!hay && !comprado`); las cantidades admitidas son 0–99.

Después de revisar las reglas, publicarlas con la CLI local:

```bash
npm exec --no -- firebase deploy --only firestore:rules --project TU_PROYECTO
```

Este comando modifica Firebase. Las reglas nuevas solo se aplican al publicarlas; actualizar este repositorio no cambia el proyecto remoto.

## Automatización local

Está deshabilitada por defecto. Requiere Google Chrome instalado en la misma máquina donde corre Next.js y un único propietario del perfil del navegador.

En `.env.local`, configurar `ENABLE_BROWSER_AUTOMATION=true`, `AUTOMATION_OWNER_UID` con el UID de Firebase del propietario y `AUTOMATION_ORIGIN=http://localhost:3000` (o el puerto local utilizado). Configurar también `FIREBASE_PROJECT_ID` y las credenciales de aplicación de Firebase Admin, mediante workload identity o `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un archivo privado fuera del repositorio. Firebase Admin verifica firma, proyecto, expiración y revocación del token; exige UID propietario y email verificado. Nunca publicar credenciales mediante variables `NEXT_PUBLIC_*`.

Usar «Sesión» para abrir un Chrome normal con el perfil dedicado e iniciar sesión manualmente en las tiendas, incluido el acceso con Google. Google puede rechazar el inicio de sesión en navegadores controlados por automatización. Cuando termine el login, salir de ese Chrome con ⌘Q (cerrar la ventana con el botón rojo no termina el proceso en macOS) y volver a «Comprar» o «Mercado Libre»: Playwright reabre el mismo perfil por un pipe privado y conserva las cookies con el llavero real de Chrome. No se abre ningún puerto CDP. Pulsar «Sesión» cierra primero el navegador automatizado si estaba abierto. El Chrome personal no se cierra ni se usa para automatizar. El perfil se conserva en `.masonline-session/`, con permisos restringidos, y debe excluirse de cualquier despliegue o copia pública. El lanzamiento manual utiliza la instalación estándar de Google Chrome en macOS.

Las rutas requieren token Firebase y origen local exacto. Solo navegan a HTTPS de las tiendas permitidas; validan productos, redirecciones, cantidades y tamaños. Procesan un trabajo a la vez, con un intervalo mínimo de tres segundos y un máximo de diez minutos por operación. La instancia local debe ejecutar un único proceso de Next.js; el lock está en memoria y no coordina varias instancias.

MasOnline agrega productos con URL configurada. Mercado Libre busca candidatos, pide confirmación y agrega únicamente las selecciones. La automatización no completa compras ni pagos. Cambios en el DOM de las tiendas pueden requerir actualizar los selectores.

## Migración inicial

`npm run seed` usa el runner `tsx` declarado y fijado en el lockfile, sin descargas implícitas de ejecutables. Carga `serviceAccountKey.json` desde la raíz y escribe el catálogo mediante Firebase Admin, omitiendo las reglas del cliente. Ejecutar solo intencionalmente con las credenciales del proyecto correcto; no incluir el archivo en Git ni en builds.

## Dependencias

Las versiones directas están fijadas y `package-lock.json` conserva la resolución reproducible. TypeScript 6 y ESLint 9 son las versiones más recientes compatibles con los plugins de Next.js instalados; TypeScript 7 y ESLint 10 requieren soporte de esos plugins.

Los overrides de `@grpc/grpc-js`, `glob`, `minimatch`, `@opentelemetry/core` y `uuid` eliminan avisos transitivos que los paquetes superiores todavía arrastran. Revisarlos en futuras actualizaciones y retirarlos cuando ya no sean necesarios. Las verificaciones incluyen lint, tipos, build, pruebas de seguridad y carga de la CLI Firebase; no prueban operaciones remotas de Firebase ni compras reales.
