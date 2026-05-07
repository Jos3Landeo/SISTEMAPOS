# Sistema POS e Inventario para Minimarket

Monorepo inicial para un POS local/offline con backend `FastAPI + SQLAlchemy 2.0 + PostgreSQL` y frontend `React + Vite + TypeScript + TailwindCSS`.

## Estructura

- `backend/`: API, modelos, servicios, repositorios y migraciones Alembic.
- `frontend/`: interfaz administrativa, autenticacion y modulo POS inicial.

## Principios implementados

- arquitectura modular por dominio
- UUID en entidades criticas
- dinero y cantidades con `NUMERIC(12,2)`
- trazabilidad de stock y ventas
- anulaciones sin borrado fisico
- separacion entre endpoints, servicios y acceso a datos

## Backend

1. Crear base de datos PostgreSQL.
2. Copiar `backend/.env.example` a `backend/.env`.
3. Instalar dependencias:

```bash
cd backend
pip install -e .
```

4. Ejecutar migraciones:

```bash
alembic upgrade head
```

5. Levantar API:

```bash
uvicorn app.main:app --reload --port 8000
```

## Frontend

1. Copiar `frontend/.env.example` a `frontend/.env`.
2. Instalar dependencias:

```bash
cd frontend
npm install
```

3. Levantar app:

```bash
npm run dev -- --port 3000
```

## Flujo inicial sugerido

1. Ejecutar migraciones.
2. Usar `POST /api/v1/auth/bootstrap` para crear el primer administrador.
3. Iniciar sesion desde el frontend.
4. Cargar categorias, productos, metodos de pago y caja.

