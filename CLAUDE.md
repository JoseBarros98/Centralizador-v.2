# CLAUDE.md — Sistema de gestión institucional

## Contexto del proyecto

Sistema de gestión de información interno para una institución educativa. Cubre los módulos
de **Academic**, **Billing** (cobranzas), **Marketing** y **Design**. Incluye conexión a una
base de datos MySQL externa (read-only, con vistas y procedimientos almacenados), integración
con Google Calendar y Google Drive, y una capa de IA para chat interno, análisis de datos y
generación de documentos.

El sistema es de uso interno, con ~20 usuarios simultáneos, desplegado en cloud con Docker
(el mismo entorno corre local y en producción sin diferencias).

---

## Stack

### Backend
- PHP 8.3 + Laravel 12
- MySQL 8 (DB principal) + MySQL externa (read-only, segunda conexión)
- Redis (caché, sesiones, colas)
- Laravel Sanctum (autenticación)
- Spatie Laravel Permission (roles y permisos)
- Spatie Laravel Media Library (archivos)
- Spatie Laravel Activity Log (auditoría)
- Laravel Horizon (monitoreo de colas)
- Pest v3 (testing)
- Larastan nivel 8 (análisis estático)
- Laravel Pint (formato de código)

### Frontend
- React 19 + TypeScript (modo estricto)
- Inertia.js v2
- Vite 6
- Tailwind CSS v4
- shadcn/ui
- React Hook Form + Zod
- TanStack Table v8
- Lucide React

### Infraestructura
- Docker Compose (app, nginx, mysql, redis, queue, horizon)
- Un solo `docker-compose.yml` válido para local y cloud
- Variables de entorno via `.env` (nunca hardcodeadas)

---

## Arquitectura — reglas que NUNCA se rompen

### Estructura de módulos

Cada dominio de negocio vive en `app/Modules/{Nombre}/` con esta estructura interna:

```
app/Modules/Academic/
├── Actions/          # Una clase = una operación de negocio
├── DTOs/             # Objetos tipados para mover datos entre capas
├── Models/           # Eloquent sin lógica de negocio
├── Repositories/     # Toda consulta a DB pasa por acá
├── Services/         # Lógica reutilizable, agnóstica de HTTP
├── Http/
│   ├── Controllers/  # Solo recibe, valida y responde
│   ├── Requests/     # Validación via FormRequest
│   └── Resources/    # Transformación de respuesta
├── Events/
├── Listeners/
└── routes.php        # Rutas propias del módulo
```

Módulos a crear: `Academic`, `Billing`, `Marketing`, `Design`.

Código compartido entre módulos:

```
app/Shared/
├── Contracts/    # Interfaces (RepositoryInterface, AiProviderInterface)
├── Services/     # GoogleCalendarService, GoogleDriveService, AiService
├── DTOs/         # DTOs reutilizables (PaginationDTO, AiResponseDTO)
├── Traits/       # HasAuditLog, HasMediaFiles
└── Exceptions/   # BusinessException, ExternalServiceException

app/Infrastructure/
├── ExternalDb/   # Repositorios que consultan la DB externa
├── AI/           # ClaudeProvider, OpenAiProvider (implementan AiProviderInterface)
└── Google/       # CalendarClient, DriveClient
```

Frontend espeja la misma estructura:

```
resources/js/
├── modules/
│   ├── academic/   { pages/, components/, hooks/, types/ }
│   ├── billing/
│   ├── marketing/
│   └── design/
└── shared/         { components/, hooks/, lib/, types/ }
```

### Reglas por capa

**Controllers** — máximo 10 líneas por método. Solo esto:
```php
public function store(EnrollStudentRequest $request): InertiaResponse
{
    $dto = EnrollmentDTO::fromRequest($request);
    $enrollment = ($this->enrollStudent)($dto);
    return Inertia::render('Academic/Enrollments/Show', [
        'enrollment' => EnrollmentResource::make($enrollment),
    ]);
}
```

**Actions** — una clase, un método `__invoke`, una operación:
```php
final class EnrollStudentAction
{
    public function __construct(
        private readonly EnrollmentRepository $enrollments,
        private readonly EnrollmentService $service,
    ) {}

    public function __invoke(EnrollmentDTO $dto): Enrollment
    {
        // orquesta servicios y repositorios, dispara eventos
    }
}
```

**DTOs** — siempre tipados, con factory `fromRequest()` y `fromArray()`:
```php
final readonly class EnrollmentDTO
{
    public function __construct(
        public string $studentId,
        public string $courseId,
        public Carbon $startDate,
    ) {}

    public static function fromRequest(EnrollStudentRequest $request): self { ... }
}
```

**Repositories** — implementan una interface, usan Eloquent internamente:
```php
interface EnrollmentRepositoryInterface
{
    public function findById(string $id): ?Enrollment;
    public function save(Enrollment $enrollment): Enrollment;
    public function findActiveByStudent(string $studentId): Collection;
}
```

**Models** — sin lógica de negocio. Solo: relaciones, casts, fillable, scopes simples.

**Services** — lógica reutilizable. Pueden ser llamados desde Actions o desde Jobs.

**Events/Listeners** — para comunicación entre módulos sin acoplamiento directo:
```php
// Academic dispara → Billing escucha. Academic no sabe nada de Billing.
event(new StudentEnrolled($enrollment));
```

---

## Convenciones de código

- **PHP**: `final class` por defecto. `readonly` en DTOs. Tipos estrictos en todo.
  `declare(strict_types=1)` en cada archivo PHP.
- **Nombres**: Actions en verbo+sustantivo (`EnrollStudentAction`). Repositories en
  sustantivo+Repository. Services en sustantivo+Service.
- **No arrays anónimos** entre capas — siempre DTOs.
- **No lógica en Blade/React** que debería estar en backend.
- **TypeScript estricto**: no `any`, interfaces para todo, props tipados.
- **Componentes React**: máximo ~150 líneas. Si crece, extraer subcomponentes.
- **Hooks personalizados** para lógica de estado compleja (`useEnrollmentForm`, `useStudentSearch`).
- Cada módulo de frontend exporta sus tipos desde `modules/{nombre}/types/index.ts`.

---

## Base de datos

### Conexión principal (`mysql`)
Migraciones en `database/migrations/{modulo}/`. Prefijo de tabla por módulo:
- `academic_*` → students, enrollments, courses, grades
- `billing_*` → invoices, payments, payment_plans
- `marketing_*` → campaigns, leads, contacts
- `design_*` → projects, assets, deliverables
- `shared_*` → users, roles, media, activity_log, ai_conversations

### Conexión externa (`mysql_externa`, read-only)
Configurada en `config/database.php` como segunda conexión.
Los modelos/repositorios que la usan llevan el sufijo `External` y llaman a `->on('mysql_externa')`.
Nunca se escriben migraciones para esta conexión.

---

## Integraciones externas

### Google (Calendar y Drive)
- Autenticación OAuth2 por usuario, tokens guardados en DB.
- `GoogleCalendarService` y `GoogleDriveService` en `app/Shared/Services/`.
- Operaciones lentas (subir archivos, sync masivo) siempre en Jobs de cola.

### IA
- Interface `AiProviderInterface` con métodos: `chat()`, `analyze()`, `generateDocument()`.
- Implementaciones en `app/Infrastructure/AI/`: `ClaudeProvider`, `OpenAiProvider`.
- El binding activo se configura en `.env` → `AI_PROVIDER=claude`.
- Historial de conversaciones guardado en `shared_ai_conversations` con `context_type` y
  `context_id` (polimórfico) para saber a qué módulo pertenece cada conversación.
- Procesamiento pesado (análisis de datos, generación de reportes) siempre via Jobs.

---

## Docker

`docker-compose.yml` en la raíz con los servicios:
- `app` — PHP-FPM 8.3
- `nginx` — servidor web
- `mysql` — base de datos principal
- `redis` — caché y colas
- `queue` — worker de Laravel
- `horizon` — dashboard de colas

Usar `Dockerfile` multi-stage: stage `builder` para assets, stage `production` para runtime.
Variables sensibles solo en `.env`, nunca en el `docker-compose.yml`.

---

## Testing

- Pest v3 para todo el testing.
- Tests unitarios para Actions, Services y DTOs.
- Tests de feature para endpoints HTTP (usando `RefreshDatabase`).
- Factories para todos los modelos.
- Mocks para servicios externos (Google, IA) — nunca llamadas reales en tests.
- Estructura: `tests/Unit/Modules/{Modulo}/` y `tests/Feature/Modules/{Modulo}/`.

---

## Cómo iterar en este proyecto

Cuando se pida construir algo nuevo, seguir siempre este orden:

1. **Migración** → crear tabla(s) necesarias
2. **Model** → relaciones y casts
3. **DTO** → tipado de datos de entrada
4. **Repository + Interface** → acceso a datos
5. **Service** → lógica reutilizable (si aplica)
6. **Action** → orquestación de la operación
7. **FormRequest** → validación HTTP
8. **Controller** → delegar a la Action
9. **Resource** → transformar respuesta
10. **Ruta** → registrar en `routes.php` del módulo
11. **Frontend** → página Inertia + tipos TypeScript
12. **Tests** → unitario de la Action, feature del endpoint

Nunca saltarse pasos ni colapsar capas "para ir más rápido".

---

## Lo que está prohibido

- Lógica de negocio en Controllers
- Queries Eloquent directas en Controllers o Actions (van en Repositories)
- Arrays anónimos como parámetros entre capas (usar DTOs)
- `any` en TypeScript
- Hardcodear credenciales, URLs de API o configuración
- Lógica en Modelos más allá de relaciones, casts y scopes simples
- Un archivo de rutas global con rutas de todos los módulos
- Jobs síncronos para operaciones con APIs externas

---

## Primeros pasos sugeridos al iniciar

```
1. Scaffold del proyecto Laravel 12 con Inertia + React + TypeScript
2. Configurar Docker Compose completo
3. Instalar y configurar todos los paquetes Spatie
4. Crear AppServiceProvider con bindings de Repositories e Infrastructure
5. Scaffold de los 4 módulos (estructura de carpetas + ServiceProvider por módulo)
6. Módulo Shared: Contracts, base DTOs, excepciones, traits
7. Autenticación con Sanctum + roles con Spatie Permission
8. Layout base en React con navegación por módulo
9. Primer módulo completo de punta a punta: Academic > Students (CRUD)
10. Integración Google OAuth2 base
```
