# Nice-mssql

Super flexible and easy to use mssql library.

Nice-mssql doesn't have design restrictions, performance problems and saves a lot of time instead of using ORM. Use ORM wisely.

## Features

- Based on [node-mssql](https://www.npmjs.com/package/mssql) and fully compatible
- Developer-friendly error stack trace instead of mssql
- Base tools for easy coding
- TypeScript friendly

## Install

```shell
npm i nice-mssql -s
```

*Remove the `mssql` package from package.json if you have it. Use nice-mssql instead. It's fully compatible.*

## Example of usage

[See the example folder of use.](https://github.com/kostyukdg/nice-mssql/tree/main/example)

## Import

```ts
// ESModule / TypeScript
import * as sql from "nice-mssql";

// Or CommonJS
const sql = require("nice-mssql");
```

### Connection

Create a global pool connection for an app. Place it before using mssql.

```ts
import { connectToMssql } from "nice-mssql";

await connectToMssql({
  user: 'xxx',
  password: 'xxx',
  database: 'xxx',
  server: 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
});
```

### QueryRepository

It's a simple place to store db queries separately from business logic. See [the example](https://github.com/kostyukdg/nice-mssql/tree/main/example) folder of use.

1. Create a query class for a table.
    ```ts
    // repositories/UsersRepository.ts
    import { QueryRepository, Int, NVarChar } from "nice-mssql";
    
    export interface User {
      id: number;
      name: string;
    }
    
    export class UsersRepository extends QueryRepository {
      async findOneById(id: User['id']): Promise<User | null> {
        let user = null;
        const request = this.getRequest();
        const queryResult = await request
          .input('id', Int, id)
          .query(`
            SELECT
              users.id,
              users.name
            FROM
              users
            WHERE
              id = @id
          `);
        if (queryResult.recordset.length === 1) {
          [user] = queryResult.recordset;
        }
    
        return user;
      }
      
      async updateNameById(id: User['id'], name: User['name']): Promise<void> {
        const request = this.getRequest();
        await request
          .input('id', Int, id)
          .input('name', NVarChar, name)
          .query(`
            UPDATE
              users
            SET
              name = @name
            WHERE
              id = @id
          `);
      }
    }
    
    export default UsersRepository;
    ```
2. Export all query classes from one place for easy importing into the project.
    ```ts
    // repositories/index.ts
    export { getRepository } from "nice-mssql";
    
    export * from './UsersRepository';
    ```
3. Use in the project.
    ```ts
    export { getRepository, UsersRepository } from './db';
    
    const usersRepository = new UsersRepository();
    const user1 = await usersRepository.findOneById(11);
    // OR
    const user2 = await getRepository(UsersRepository).findOneById(11);
    ```
    There are 2 ways of using query class: using new or getRepository for single use.

*You could give any name for query classes, folders or alias for getRepository.*

### IN clause array parameter in query

1. Request.parametrizeInClause method
   ```ts
   export { getRequest, Int } from "nice-mssql";

   const request = getRequest();
   
   const parameters = request.parametrizeInClause('ids', Int, [1, 2, 3]);
   
   const users = await request.query(`SELECT * FROM users WHERE id IN (${parameters})`);
   ```
   It's a type-safe, simple solution with no downsides.
2. Template literals
   ```ts
   export { getRequest } from "nice-mssql";

   const request = getRequest(); 
   const users = await request.query`SELECT * FROM users WHERE id IN (${[1, 2, 3, 4]})`;
   ```
   A type is detected automatically and every variable will be as a parameter, so it's not allowed to have some parts of query as variable. Sometimes it could be a problem. [Default Data Type Map](https://www.npmjs.com/package/mssql#input-name-type-value)


### Slow query log

Logs all queries exceeding the time limit.

#### Setup global slow query logging

```ts
import { connectToMssql } from "nice-mssql";

await connectToMssql({
  ...,
  slowQueryLogger: {
    maxExecutionTime: 500,
    logger: (
      error, // contains a full stack trace of the execution
      executionTime, // real execution time
    ) => {
      console.log(error, executionTime);
    },
  },
});
```

#### Redeclare maxExecutionTime for QueryRepository or specific Request

```ts 
// repositories/UsersRepository.ts
export class UsersRepository extends QueryRepository {
  // Sets max execution query time logging for all this repository queries
  slowQueryMaxExecutionTime = 1000;

  async findAll(): Promise<User[]> {
    const request = this.getRequest();

    // Redeclare only maxExecutionTime for specific request
    request.setSlowQueryMaxExecutionTime(1000);

    // Initialize or redeclare slow query logger for request
    request.setSlowQueryLogger({
      maxExecutionTime: 1500,
      logger: (error, executionTime) => {
        console.log(error, executionTime);
      },
    });

    // Redeclare some slow query logger properties 
    const slowQueryLogger = request.getSlowQueryLogger();
    if (slowQueryLogger) {
      request.setSlowQueryLogger({
        ...slowQueryLogger,
        maxExecutionTime: 1000,
      });
    }

    const users = await request.query('SELECT * FROM users');

    return users.recordset;
  }
}
```

### getRequest(transaction?: Transaction)

Returns Request for global pool or received transaction.

```ts
import { getRequest, Int } from "nice-mssql";

const data = await getRequest()
  .input('id', Int, id)
  .query('SELECT * FROM users WHERE id = @id');
```

### getTransaction

Returns Transaction for a global pool. It's the same as in node-mssql, but it easier to use in QueryRepository or getRequest.

```ts
import { getRequest, getTransaction, Int } from "nice-mssql";

const transaction = getTransaction();
await transaction.begin();

const request = getRequest(transaction);
await request.query('UPDATE users SET name = "bob" WHERE id = 1');
await request.query('UPDATE users SET name = "lily" WHERE id = 2');

// More details in example folder
await getRepository(UsersRepository, transaction).updateNameById(3, 'mark');

const usersRepository = new UsersRepository(transaction);
await usersRepository.updateNameById(1, 'bob');
await usersRepository.updateNameById(2, 'lily');

const usersExampleRepository = new UsersRepository();
// For dependency injection cases, use the useTransaction method. It returns a new instance of the class with the desired transaction.
await usersExampleRepository.useTransaction(transaction).updateNameById(1, 'bob');

await transaction.commit();
```

### getPool

Returns global pool

### closeMssqlConnection

Close global pool connection

### More API methods

Full API methods in [node-mssql](https://www.npmjs.com/package/mssql)