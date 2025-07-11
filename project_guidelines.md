# 🧭 Проектный Гайдлайн для Сотрудников

## 📦 Общая Архитектура

Проект реализован в микросервисной архитектуре с использованием **NestJS Workspaces**. Каждый сервис следует принципам **Clean Architecture** и включает следующие слои:

- **Interface** – контроллеры, DTO
- **Application** – use-cases, query-handlers, сервисы и бизнес-логика
- **Domain** – доменные сущности
- **Infrastructure** – репозитории и внешние адаптеры

### 🧱 Структура Микросервисов

- **Main-service (apps/gd-main-app)** – основной API (включая gateway)
- **Files (apps/files-service)** – файловый микросервис
- **Notification (apps/notification-service)** – почтовый сервис уведомлений

## 🚀 Запуск

### Dev-режим

```bash
pnpm start:dev:gd-main-app
pnpm start:dev:files-service
pnpm start:dev:notification-service
```

### Production-режим

```bash
pnpm start:gd-main-app
pnpm start:files-service
pnpm start:notification-service
```

> Миграции БД автоматически применяются при запуске **основного микросервиса** в production.

## 📁 Стандарты и Стиль Кода

### Именование

- **Файлы:** dot-notation (например, `user.repository.ts`)
- **Классы:** PascalCase (например, `AppNotification`)
- **Методы, переменные:** camelCase
- **Константы:** SCREAMING\_SNAKE\_CASE (например, `API_VERSION`)

### Расположение файлов

- Контроллеры: `*.controller.ts`
- Сервисы: `*.service.ts`
- Use Cases: `*.use.case.ts` или `*use-case.ts`
- DTO: `*.input.dto.ts` или `*input.dto.ts`
- Сущности: `*.entity.ts`
- Репозитории: `*.repository.ts`

## 🔁 Паттерны и Подходы

- **CQRS**: используется `CommandBus` и `QueryBus`
- **EventEmitter** для событий
- **DTO** используют `class-validator` декораторы

## 🛠️ Технологический Стек

- `TypeScript`
- `NestJS`
- `TypeORM`
- `Passport`
- `Argon2`
- `Class-validator`
- `Swagger`
- `@nestjs/cqrs`
- `ESLint + Prettier`
- `Jest`

## 🧪 Тестирование

- **Unit-тесты** — для бизнес-логики (слой Application)
- **E2E-тесты** — для API endpoint-ов

> Внешние зависимости и сервисы **обязательно мокать**

## 📄 Работа с .env

### Файлы

- `.env.development.local` – локальная разработка (не попадает в VCS)
- `.env.production` – продакшн
- `.env.production` – для пайплайн тестов

### Обновление .env

1. Добавь новую переменную в `env.example`
2. Добавь геттер в нужный `ConfigService`
3. Добавь валидацию в `Joi`

## 🧬 Работа с Базой Данных

1. При изменении сущностей (`*.entity.ts`) — создай миграцию:
  
2. Примени миграцию к БД:
   
3. Сообщи команде, что появились новые миграции

## 🧾 API Endpoints

1. Используй корректные **HTTP статус-коды**
2. DTO обязательно валидируй через `class-validator`
3. Добавляй документацию с помощью **Swagger** декораторов
4. Используй **Guards**, если требуется защита

## 📌 Рекомендации по Разработке

1. **Use Cases** создавай в `application/use-cases/`
2. DTO — в `interface/dto/`
3. Регистрируй всё в соответствующих модулях
4. Не забывай Swagger-документацию

## 🚢 Деплой

- Контейнеризация: `Docker`
- CI/CD: `Jenkins`
- Оркестрация: `Kubernetes`
- БД: `PostgreSQL`

---

Если остались вопросы — обращайся к тимлиду или используй внутреннюю вики команды.

