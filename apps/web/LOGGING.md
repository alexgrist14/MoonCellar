# Настройка логирования для Grafana/Loki

## Описание

В проекте настроена система логирования, которая отправляет все ошибки и важные события в Grafana через Loki. Это позволяет отслеживать проблемы на фронтенде в реальном времени.

## Переменные окружения

Добавьте в `.env.local` или `.env`:

```env
NEXT_PUBLIC_LOKI_HOST=http://localhost:3100
```

Для продакшена используйте URL вашего Loki сервера:

```env
NEXT_PUBLIC_LOKI_HOST=https://loki.yourdomain.com
```

## Что логируется

### 1. Ошибки Next.js

- Ошибки в роутах (через `error.tsx`)
- Глобальные ошибки приложения (через `global-error.tsx`)

### 2. Ошибки API запросов

- Все ошибки из axios interceptor
- Ошибки обновления токена
- Детали запросов (URL, метод, статус код)

### 3. Глобальные ошибки браузера

- Необработанные исключения (`window.onerror`)
- Необработанные промисы (`unhandledrejection`)
- Ошибки загрузки ресурсов (изображения, скрипты, стили)

## Использование

### Базовое использование

```typescript
import { logger } from "@/src/lib/shared/utils/logger.utils";

// Логирование ошибки
logger.error("Something went wrong", error, {
  userId: "123",
  action: "saveGame",
});

// Логирование предупреждения
logger.warn("Deprecated API used", {
  endpoint: "/api/old-endpoint",
});

// Логирование информации
logger.info("User action", {
  action: "click",
  element: "button",
});

// Отладочное логирование
logger.debug("Debug info", {
  state: currentState,
});
```

### В компонентах React

```typescript
"use client";

import { logger } from "@/src/lib/shared/utils/logger.utils";
import { useEffect } from "react";

export function MyComponent() {
  useEffect(() => {
    try {
      // ваш код
    } catch (error) {
      logger.error("Component error", error, {
        component: "MyComponent",
      });
    }
  }, []);
}
```

## Структура логов

Каждый лог содержит:

- `level`: уровень логирования (error, warn, info, debug)
- `msg`: сообщение
- `err`: объект ошибки (если есть)
- `context`: дополнительный контекст
- `url`: текущий URL страницы
- `userAgent`: User Agent браузера
- `userId`: ID пользователя (если авторизован)
- `timestamp`: временная метка

## Батчинг

Логи отправляются батчами для оптимизации:

- Размер батча: 10 логов
- Таймаут: 5 секунд
- Автоматическая отправка при закрытии страницы

## Проверка работы

1. Убедитесь, что Loki запущен и доступен по адресу из `NEXT_PUBLIC_LOKI_HOST`
2. Откройте консоль браузера - там будут дублироваться все логи
3. Проверьте Grafana - логи должны появляться в дашборде

## Запросы в Grafana

Пример запроса для поиска всех ошибок:

```
{app="mooncellar-frontend", level="error"}
```

Поиск ошибок по URL:

```
{app="mooncellar-frontend", level="error"} |= "/api/games"
```

Поиск ошибок конкретного пользователя:

```
{app="mooncellar-frontend", level="error"} | json | userId="authenticated"
```
