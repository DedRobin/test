# Database Transactions Practice Environment

Изучение транзакций базы данных на SQLite + Node.js.

## Установка

```bash
npm install
npm run setup
```

## Примеры

### 1. Базовая транзакция (COMMIT)
```bash
npm run demo:basic
```
Демонстрация простого COMMIT — успешное применение изменений.

### 2. Откат транзакции (ROLLBACK)
```bash
npm run demo:rollback
```
Показывает ROLLBACK при возникновении ошибки — все изменения отменяются.

### 3. Savepoints (частичный откат)
```bash
npm run demo:savepoint
```
Демонстрация SAVEPOINT — возможность откатить часть транзакции.

### 4. Изоляция транзакций
```bash
npm run demo:isolation
```
Показывает проблемы изоляции: dirty reads, non-repeatable reads, phantom reads.

### 5. Все примеры вместе
```bash
npm run demo:all
```

## Структура базы данных

Схема `banking.db`:
- **Accounts** — банковские счета (id, user_name, balance)
- **Transactions** — история переводов (id, from_account, to_account, amount, timestamp)

## Ключевые концепции

### ACID Properties
- **Atomicity** — все или ничего
- **Consistency** — корректное состояние до и после
- **Isolation** — параллельные транзакции не влияют друг на друга
- **Durability** — после COMMIT данные сохранены

### SQLite Transaction Modes
- `DEFERRED` (default) — начинает read-only, повышает при необходимости
- `IMMEDIATE` — сразу блокирует запись
- `EXCLUSIVE` — полная блокировка

## Полезные ссылки
- [SQLite Transactions](https://www.sqlite.org/lang_transaction.html)
- [SQLite Isolation Levels](https://www.sqlite.org/isolation.html)
