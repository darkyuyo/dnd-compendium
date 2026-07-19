# D&D Compendium

Compendio privado de referencia para tu mesa de **Dungeons & Dragons** (reglas 2024).

App en **Next.js + TypeScript** con interfaz en **español e inglés**. El contenido sale de tus PDFs del Manual del Jugador y el Manual de Monstruos.

> Solo para uso personal / de la mesa. No publiques el texto de los libros ni subas el repo a un remoto público.

## Qué incluye

| Sección | Descripción |
|---------|-------------|
| Monstruos | Stat blocks con búsqueda y filtro por tipo |
| Conjuros | Listado completo con filtros (nivel, escuela) |
| Clases | 12 clases con rasgos por nivel |
| Especies | Atributos y rasgos raciales |
| Orígenes | Trasfondos de personaje |
| Dotes | Dotes de origen, generales, etc. |
| Armas / Equipo | Tablas de armas y equipo de aventurero |
| Guías | Cómo jugar y crear personaje |

## Arrancar

Requisitos: Node.js 20+.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Por defecto entra en `/es`. Cambia idioma con el botón **EN / ES** del header.

### Cuentas y personajes

1. **Registro** / **Entrar** en el header.
2. Ve a **Personajes** → crear hoja.
3. Rellena la ficha (combate / magia), sube una **foto**, y añade conjuros, armas, armaduras y equipo desde el compendio (botón **Info** abre la ficha).

**Local:** usuarios y personajes en `data/` (gitignored). Fotos en `public/uploads/`.

**Producción (Vercel):** hace falta Postgres. Crea una DB gratis en [Neon](https://neon.tech), copia el connection string y añádelo en Vercel → **Settings → Environment Variables**:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=una-cadena-larga-aleatoria
```

Sin `DATABASE_URL`, el registro en Vercel fallará (el filesystem serverless no permite guardar `data/`).

Para producción:

```bash
npm run build
npm start
```

## Contenido y PDFs

Los datos viven en `content/` (JSON + guías MDX). Campos bilingües:

```json
{ "es": "Bola de fuego", "en": "Fireball" }
```

Si falta un idioma, la UI muestra el otro y marca “Sin traducir”.

### Pipeline (rellenar / regenerar desde tus libros)

1. Coloca (o apunta) tus PDFs. Por defecto el extractor busca:
   - `D:\Descargas\Manual del Jugador 2024.pdf`
   - `D:\Descargas\Manual de Monstruos - Ingles.pdf`

   Opcional en `.env.local`:

   ```env
   PHB_PDF_PATH=D:\ruta\al\Manual del Jugador 2024.pdf
   MM_PDF_PATH=D:\ruta\al\Manual de Monstruos - Ingles.pdf
   ```

2. Extrae texto crudo:

   ```bash
   npm run extract:phb
   npm run extract:mm
   ```

   Sale en `raw/phb/` y `raw/mm/` (ignorado por git).

3. Parsea a JSON tipado:

   ```bash
   npm run parse:all
   npm run content:validate
   ```

### Calidad del parseo

| Fuente | Calidad típica |
|--------|----------------|
| PHB (ES) | Buena en conjuros, clases, dotes, especies |
| MM (EN) | Nombres desde el índice; stats por OCR (revisar fichas importantes contra el PDF) |

Para merges manuales o validación fina, ver [`scripts/README.md`](scripts/README.md).

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` | ESLint |
| `npm run extract:phb` | PDF PHB → `raw/phb/` |
| `npm run extract:mm` | PDF MM → `raw/mm/` |
| `npm run parse:all` | `raw/` → `content/` |
| `npm run content:validate` | Valida todo el JSON con Zod |

## Estructura útil

```
content/          # Datos de la app (JSON + guías)
messages/         # Textos de UI (es.json / en.json)
raw/              # Texto extraído de PDFs (gitignored)
scripts/          # Extracción y parseo
src/app/[locale]/ # Rutas /es/... y /en/...
```

## Notas

- No hace falta `.env` para usar la web en local.
- Comparte la app en LAN con `npm start` en un PC de la mesa si quieres; evita desplegarla en público con el contenido de los manuales.
