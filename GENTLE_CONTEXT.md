# Gentle AI — Contexto del Proyecto Lubricentro G&G

> Este archivo contiene todo el contexto de la sesion SDD para restaurarlo
> en otra PC con OpenCode + Gentle AI.
>
> **Como usarlo:**
> 1. Clonar el repo en la otra PC
> 2. Abrir OpenCode en el proyecto
> 3. Ejecutar `/sdd-init-barato` primero
> 4. Leer este archivo como contexto inicial
> 5. Ejecutar `/sdd-continue lubricentro-webapp` para retomar el estado

---

## Datos del Proyecto

- **Nombre**: Lubricentro G&G
- **Directorio**: `C:\Users\cseifar\lubricentro` (original), clonar en cualquier lado
- **GitHub**: vinculado al repo del usuario
- **Estado**: Ciclo SDD completo (init -> explore -> propose -> spec -> design -> tasks -> apply x6 -> verify -> archive)

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Backend | Python 3.13+ / FastAPI |
| Base de datos | SQLite (local) / PostgreSQL (produccion) via SQLAlchemy 2.0 async |
| ORM | SQLAlchemy 2.0 (async, Mapped/mapped_column style) |
| Migraciones | Alembic (async SQLite + PostgreSQL) |
| Frontend | React 19 + Vite + Tailwind CSS v4 + TanStack Query v5 |
| Idioma frontend | Espanol |
| Tema | Dark mode, rojo/blanco/negro |
| Excel | openpyxl (importacion y actualizacion de precios) |

## Base de Datos

**6 tablas**: categories, brands, products, stock_movements, sales, sale_items

**Datos importados**: 4.927 productos, 26 marcas, 12 categorias
Desde: `LISTA DE PRECIO JULIO 2026.xlsx` (30 hojas, formato por marca)

**Import script**: `scripts/import_xlsx_all.py` (maneja formato especifico por marca)
**Valvoline CSV**: `scripts/import_valvoline_csv.py`

## Decisiones de Arquitectura

1. **SQLite sobre PostgreSQL**: Zero-config, single-file. Migracion via SQLAlchemy si se necesita escalar.
2. **FastAPI sobre Express**: Python nativo para Excel (openpyxl). Auto Swagger docs.
3. **React Query sobre Redux**: App single-user CRUD. Sin necesidad de estado global.
4. **Excel import como script standalone**: Una sola migracion. Sin superficie API extra.
5. **Import por marca**: Cada hoja del Excel tiene formato unico. Mapeo especifico por nombre de marca.

## Rutas de la API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/products | Listar productos (search, filter) |
| POST | /api/products | Crear producto |
| GET/PUT/DELETE | /api/products/{id} | CRUD producto |
| GET/POST | /api/categories | CRUD categorias |
| GET/POST | /api/brands | CRUD marcas |
| GET | /api/stock/movements | Historial movimientos |
| POST | /api/stock/movements | Registrar movimiento |
| POST | /api/stock/receive | Recepcion mercaderia |
| GET | /api/sales | Listar ventas |
| POST | /api/sales | Registrar venta |
| PUT | /api/prices/bulk | Actualizacion masiva de precios |
| POST | /api/prices/upload-excel | Subir Excel para actualizar precios |
| GET | /api/reports/dashboard | KPIs del dashboard |
| GET | /api/reports/best-sellers | Productos mas vendidos |
| GET | /api/reports/stock-history/csv | Exportar CSV movimientos |
| GET | /api/reports/reorder-list | Lista de reposicion |
| GET | /api/reports/profit-margin | Margen de ganancia |

## Frontend — Paginas

| Ruta | Pagina |
|------|--------|
| / | Panel Principal (dashboard) |
| /products | Lista de Productos |
| /products/new | Nuevo Producto |
| /products/:id/edit | Editar Producto |
| /stock | Movimientos de Stock |
| /stock/receive | Recepcion de Mercaderia |
| /sales | Ventas |
| /sales/new | Nueva Venta |
| /prices | Gestion de Precios |
| /reports | Reportes |

## Colores del Tema

- Fondo: `#0a0a0a` (body), `#1a1a1a` (tarjetas), `#222` (elevado)
- Primario: `#dc2626` (rojo), hover `#b91c1c`
- Texto: `#ffffff` (primario), `#a0a0a0` (secundario)
- Bordes: `#333`
- Exito: `#22c55e` (verde solo texto)
- Advertencia: `#eab308` (amarillo solo texto)

## Pruebas

- **Backend**: 59 tests (pytest-asyncio + httpx.AsyncClient + in-memory SQLite)
- **Excel import**: 16 tests
- **Frontend**: build TypeScript sin errores
- **Total**: 75 tests, todos pasando

## Deploy

- **Dockerfile**: listo en la raiz del proyecto
- **Railway**: configurado (nixpacks.toml eliminado, usa Dockerfile)
- **Fly.io**: `fly launch` + `fly deploy`
- **Local + Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:8000`
- **Hetzner VPS**: comando directo con uvicorn

## Funcionalidades Pendientes / Mejoras

1. ~~Subir Excel desde la interfaz~~ ✅ IMPLEMENTADO
2. Migrar datos de SQLite a PostgreSQL (script: `scripts/export_to_postgres.py`)
3. Arreglar `datetime.utcnow()` deprecation en `services/reports.py`
4. Agregar `.gitignore` completo (node_modules, venv, __pycache__, *.db)
5. Dashboard: mostrar nombre de producto en movimientos recientes (no solo product_id)

## Engram Observations (para exportar a otra PC)

En la PC actual, estas observaciones de Engram contienen el historial completo SDD:

| ID | Artifact | Topic Key |
|----|----------|-----------|
| #66 | SDD Init | sdd-init-barato/lubricentro |
| #68 | Exploration | sdd/lubricentro-webapp/explore |
| #69 | Proposal | sdd/lubricentro-webapp/proposal |
| #70 | Spec | sdd/lubricentro-webapp/spec |
| #71 | Design | sdd/lubricentro-webapp/design |
| #72 | Tasks | sdd/lubricentro-webapp/tasks |
| #73 | Apply Progress | sdd/lubricentro-webapp/apply-progress |
| #76 | Verify Report | sdd/lubricentro-webapp/verify-report |
| #77 | Archive Report | sdd/lubricentro-webapp/archive-report |

## Como empezar en la otra PC

```powershell
git clone <url-del-repo> lubricentro
cd lubricentro
code .
# En OpenCode, ejecutar:
# 1. /sdd-init-barato
# 2. Leer este archivo como contexto
# 3. /sdd-continue lubricentro-webapp
```
