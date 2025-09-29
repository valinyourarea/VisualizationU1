# Movie Database API - PostgreSQL + MongoDB

Sistema de análisis y gestión de datos de usuarios y sesiones de visualización con arquitectura dual de bases de datos: PostgreSQL para datos relacionales estructurados y MongoDB para almacenamiento de documentos JSON.

---

## Arquitectura del Sistema

- **PostgreSQL**: Base de datos relacional para datos estructurados con integridad referencial
- **MongoDB**: Base de datos NoSQL para documentos JSON flexibles
- **FastAPI**: Framework web moderno para crear APIs RESTful
- **Docker**: Orquestación de servicios mediante contenedores

---

## Prerequisites

Antes de comenzar, asegúrese de tener instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Visual Studio Code](https://code.visualstudio.com/) *(recomendado)*
- Git

---

## Installation & Setup

### Step 1: Clone the repository
```bash
git clone https://github.com/JoaquinMO17/Proyectos_Visualizacion
cd Proyectos_Visualizacion
```

### Step 2: Configure environment variables
```bash
# Crear archivo .env con las siguientes variables:
POSTGRES_USER=postgres
POSTGRES_PASSWORD=AbraKada99$
POSTGRES_DB=videoanalysisdb
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:AbraKada99$@db:5432/videoanalysisdb
```

### Step 3: Start Docker containers
```bash
# Asegurarse de que Docker Desktop esté ejecutándose
docker compose up --build
```

### Step 4: Verify services are running
```bash
docker ps
# Deberías ver 3 contenedores:
# - fastapi-app (aplicación)
# - fastapi-db (PostgreSQL)
# - fastapi-mongodb (MongoDB)
```

---

## API Endpoints Documentation

### Base URL
```
http://localhost:8000
```

### 📊 General Information

#### `GET /`
**Descripción**: Muestra información general de la API y todos los endpoints disponibles  
**Respuesta**: JSON con estructura de endpoints organizados por base de datos

**Ejemplo**:
```bash
curl http://localhost:8000/
```

#### `GET /docs`
**Descripción**: Documentación interactiva de la API (Swagger UI)  
**Acceso**: Abrir en navegador `http://localhost:8000/docs`

---

### 🐘 PostgreSQL Endpoints

#### `GET /docs`
**Descripción**: Verifica la conexión con PostgreSQL y muestra conteos de tablas  
**Respuesta**: Estado de conexión y cantidad de registros por tabla

**Ejemplo**:
```bash
curl http://localhost:8000/
```

#### `GET /test-db`
**Descripción**: Ejecuta el proceso ETL completo (Extract, Transform, Load)  
**Función**: Extrae datos del CSV, los transforma y los carga en PostgreSQL  
**Modo**: Síncrono (espera hasta completar)

**Ejemplo**:
```bash
curl http://localhost:8000/test-db
```

#### `POST /run-etl`
**Descripción**: Ejecuta el proceso ETL en segundo plano  
**Función**: Mismo que `/run-etl` pero no bloquea la respuesta  
**Modo**: Asíncrono (retorna inmediatamente)

**Ejemplo**:
```bash
curl -X POST http://localhost:8000/run-etl

```
#### `GET /users`
**Descripción**: Ejecuta el proceso ETL en segundo plano  
**Función**: Mismo que `/run-etl` pero no bloquea la respuesta  
**Modo**: Asíncrono (retorna inmediatamente)

**Ejemplo**:
```bash
curl -X GET http://localhost:8000/users

#### `GET /users`
**Descripción**: Lista películas con paginación  
**Parámetros**:
- `skip` (int): Número de registros a saltar (default: 0)
- `limit` (int): Cantidad de registros a retornar (default: 10)

**Ejemplo**:
```bash
# Obtener primeros 10 usuarios
curl http://localhost:8000/users

# Obtener 20 usuarios saltando los primeros 10
curl "http://localhost:8000/users?skip=10&limit=20"
```

#### `GET /api/users/active`
**Descripción**: Obtiene los usuarios más activos o recientes  
**Parámetros**:
- `limit` (int): Cantidad de usuarios (1-100, default: 10)

**Ejemplo**:
```bash
# Top 10 usuarios activos
curl http://localhost:8000/api/users/active
```

#### `GET /api/sessions/by-user/{user_id}`
**Descripción**: Busca sesiones de visualización para un usuario específico
**Parámetros de ruta**:
- `user_id` (int): ID del usuario

**Ejemplo**:
```bash
curl http://localhost:8000/api/sessions/statistics
```

#### `GET /api/sessions/search`
**Descripción**: Búsqueda avanzada de sesiones con múltiples filtros
**Par+ametros**: 
- `min_duration` (int): Duración mínima de la sesión (en segundos)
- `max_duration` (int): Duración máxima de la sesión (en segundos)
- `user_country` (int): País del usuario

**Ejemplo**:
```bash
# Búsqueda combinada
curl "http://localhost:8000/api/sessions/search?min_duration=600&user_country=US"
```
---

### 🍃 MongoDB Endpoints

#### `GET /test-mongodb`
**Descripción**: Verifica conexión con MongoDB  
**Respuesta**: Estado, colecciones disponibles y conteo de documentos

**Ejemplo**:
```bash
curl http://localhost:8000/test-mongodb
```

#### `GET /mongo/content`
**Descripción**: Lista contenidos desde MongoDB con ordenamiento

**Función:** Carga los documentos de 'content.json' 
**Parámetros:**

'skip (int):' Documentos a saltar (default: 0)

'limit (int):' Límite de documentos (1-100, default: 10)

'sort_by (str):' Campo para ordenar (default: "title")

'order (str):' "asc" o "desc" (default: "asc")

```bash
# Últimos contenidos por año
curl http://localhost:8000/mongo/content?sort_by=year&order=desc

# Ordenar por título ascendente
curl "http://localhost:8000/mongo/content?sort_by=title&order=asc&limit=20"
```

#### `GET /mongo/search`
**Descripción**: Búsqueda flexible en MongoDB  
**Parámetros**:
- `q` (str): Búsqueda general (título, descripción, género)
- `title` (str): Filtro por título
- `director` (str): Filtro por género
- `country` (str):  Año de lanzamiento
- `min_year` (int): Límite de resultados

**Ejemplo**:
```bash
# Búsqueda general por palabra clave
curl "http://localhost:8000/mongo/search?q=documentary"

# Búsqueda específica
curl "http://localhost:8000/mongo/search?genre=Action&release_year=2020"
```

#### `GET /mongo/stats`
**Descripción**: Estadísticas agregadas desde MongoDB (metadata de contenido)  
**Respuesta**:
- Total de contenidos
- Distribución por año de lanzamiento
- Top 10 géneros más frecuentes

**Ejemplo**:
```bash
curl http://localhost:8000/mongo/stats
```

#### `GET /mongo/aggregations`
**Descripción**: Agregaciones complejas de MongoDB 
**Respuesta**:
- Distribución de contenidos por duración
- Contenidos por director/creador
- Estadísticas por género

**Ejemplo**:
```bash
curl http://localhost:8000/mongo/aggregations
```

#### `POST /mongo/sync`
**Descripción**: Sincroniza todos los datos de PostgreSQL a MongoDB  
**Función**: Copia información clave de usuarios/sesiones a MongoDB para análisis combinado.

**Ejemplo**:
```bash
curl -X POST http://localhost:8000/mongo/sync
```

---

## Database Access

### PostgreSQL Access
```bash
# Acceder a PostgreSQL
docker exec -it fastapi-db psql -U postgres -d videoanalysisdb

# Comandos útiles en PostgreSQL:
\dt              # Listar tablas (users, viewing_sessions, etc.)
\d users         # Describir tabla
SELECT COUNT(*) FROM viewing_sessions;  # Contar registros
```

### MongoDB Access
```bash
# Acceder a MongoDB
docker exec -it fastapi-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin

# Comandos útiles en MongoDB:
use analysis_db
show collections
db.content.countDocuments()
db.content.findOne()
db.content.find({release_year: 2023}).limit(5)
```

---

## Data Flow

### ETL Pipeline Process
1. **Extract**: Lee archivo CSV (`data/users.csv`, data/viewing_sessions.csv) y JSON
2. **Transform**: 
   - Limpia y valida datos
   - Normaliza Usuarios y Sesiones para PostgreSQL.
   - Prepara Contenidos para MongoDB.
3. **Load**:
   - PostgreSQL: Carga incremental de Usuarios y Sesiones.
   - MongoDB: Carga de Contenidos y metadata sincronizada.

### Workflow típico
```bash
# 1. Ejecutar ETL para cargar datos en PostgreSQL (Usuarios y Sesiones)
curl -X POST http://localhost:8000/run-etl

# 2. Sincronizar metadata clave a MongoDB y asegurar que content.json esté cargado
curl -X POST http://localhost:8000/mongo/sync

# 3. Verificar datos
curl http://localhost:8000/test-db        # PostgreSQL
curl http://localhost:8000/test-mongodb   # MongoDB

# 4. Consultar datos
curl http://localhost:8000/api/users/active
curl http://localhost:8000/mongo/stats
```

---

## Project Structure
```
.
├── app.py                    # API principal FastAPI
├── database.py               # Conexión PostgreSQL
├── mongodb_database.py       # Conexión MongoDB
├── models.py                 # Modelos SQLAlchemy
├── requirements.txt          # Dependencias Python
├── docker-compose.yml        # Configuración Docker
├── Dockerfile               # Imagen Docker
├── .env                     # Variables de entorno
├── data/
│   ├── users.csv              # Datos origen: Usuarios
│   ├── viewing_sessions.csv   # Datos origen: Sesiones de visualización
│   ├── content.json           # Datos origen: Metadata de contenidos
│   ├── raw/                      # JSONs generados
│   └── processed/                # CSVs procesados
└── scripts/
    ├── etl.py               # Pipeline ETL principal
    ├── extract.py           # Extracción de datos
    ├── transform.py         # Transformación
    ├── validate.py          # Validación
    ├── load.py              # Carga PostgreSQL
    ├── init-mongo.js        # Script inicialización MongoDB
    └── services/
        └── user_service.py   # Servicio PostgreSQL (ajustado)
```

---

## Common Commands

### Docker Management
```bash
# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Limpiar todo (incluye volúmenes)
docker compose down -v

# Reconstruir contenedores
docker compose up --build
```

### Testing Endpoints
```bash
# Usar curl para pruebas rápidas
curl http://localhost:8000/endpoint

# O usar herramientas como:
# - Postman
# - Thunder Client (VSCode extension)
# - HTTPie: http localhost:8000/endpoint
```

---

## Troubleshooting

### Port already in use
**Problema**: Puerto 5432 o 27017 ya está en uso  
**Solución**: Detener servicios locales o cambiar puertos en `docker-compose.yml`

### MongoDB empty after start
**Problema**: MongoDB no tiene datos  
**Solución**: 
1. Ejecutar ETL primero: `curl -X POST http://localhost:8000/run-etl`
2. Sincronizar a MongoDB: `curl -X POST http://localhost:8000/mongo/sync`

### Connection refused
**Problema**: No se puede conectar a la API  
**Solución**: Verificar que todos los contenedores estén ejecutándose con `docker ps`

### ETL fails
**Problema**: El proceso ETL falla  
**Solución**: Verificar que los archivos 'users.csv', 'viewing_sessions.csv' y 'content.json' estén en la carpeta 'data/'.

---

## Authors
- Isaías De Jesús López Tzec [@Iasisa](https://github.com/Iasisa)
- Joaquin de Jesús Murguía Ortiz [@JoaquinMO17](https://github.com/JoaquinMO17)
- Valeria De Los Ángeles Paredes Dzib [@valinyourarea](https://github.com/valinyourarea)
- Damaris Esther Pech Aque [@damapech1](https://github.com/damapech1)
- Ana Paula Ramírez Romero [@AnaPauR](https://github.com/AnaPauR)
- Krishna Sandoval Cambranis [@Playmaker3334](https://github.com/Playmaker3334)
