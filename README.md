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
    // db/UserRepository.ts
    import { QueryRepository, Int, NVarChar } from "nice-mssql";
    
    export interface User {
      id: number;
      name: string;
    }
    
    export class UserRepository extends QueryRepository {
      async findOneById(id: User['id']): Promise<User | null> {
        let user = null;
        const sqlRequest = this.getRequest();
        const queryResult = await sqlRequest
          .input('id', Int, id)
          .query(
            'SELECT ' +
            '  users.id, users.name ' +
            'FROM ' +
            '  users ' +
            'WHERE ' +
            `  id = @id`,
          );
        if (queryResult.recordset.length === 1) {
          [user] = queryResult.recordset;
        }
    
        return user;
      }
      
      async updateNameById(id: User['id'], name: User['name']): Promise<void> {
        const sqlRequest = this.getRequest();
        await sqlRequest
          .input('id', Int, id)
          .input('name', NVarChar, name)
          .query(
            'UPDATE ' +
            '  users ' +
            'SET ' +
            '  name = @name, ' +
            'WHERE ' +
            `  id = @id`,
          );
      }
    }
    
    export default UserRepository;
    ```
2. Export all query classes from one place for easy importing into the project.
    ```ts
    // db/index.ts
    export { getRepository } from "nice-mssql";
    
    export * from './UserRepository';
    ```
3. Use in the project.
    ```ts
    export { getRepository, UserRepository } from './db';
    
    const usersRepository = new UserRepository();
    const user1 = await usersRepository.findOneById(11);
    // OR
    const user2 = await getRepository(UserRepository).findOneById(11);
    ```
    There are 2 ways of using query class: using new or getRepository for single use.

*You could give any name for query classes, folders or alias for getRepository.*

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
await getRepository(UserRepository, transaction).updateNameById(3, 'mark');

const usersRepository = new UserRepository(transaction);
await usersRepository.updateNameById(1, 'bob');
await usersRepository.updateNameById(2, 'lily');

await transaction.commit();
```

### getPool

Returns global pool

### closeMssqlConnection

Close global pool connection

### More API methods

Full API methods in [node-mssql](https://www.npmjs.com/package/mssql)