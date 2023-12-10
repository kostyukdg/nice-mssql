import { QueryRepository, Int, NVarChar } from '../../src';

const fields = ' users.id, users.name ';

export interface User {
  id: number;
  name: string;
}

export class Users extends QueryRepository {
  async findOneById(id: number): Promise<User | null> {
    let user = null;
    const sqlRequest = this.getRequest();
    const queryResult = await sqlRequest
      .input('id', Int, id)
      .query(
        'SELECT ' +
          `  ${fields} ` +
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

  async findAll(): Promise<User[]> {
    const queryResult = await this.getRequest().query<User>(
      `SELECT ${fields} FROM users`,
    );
    return queryResult.recordset;
  }

  async add(id: number, name: string): Promise<void> {
    const sqlRequest = this.getRequest();
    await sqlRequest
      .input('id', Int, id)
      .input('name', NVarChar, name)
      .query(
        'INSERT INTO users (' +
          `  ${fields} ` +
          ') ' +
          'VALUES ' +
          '(' +
          '  @id, ' +
          '  @name, ' +
          ')',
      );
  }

  async updateNameById(id: number, name: string): Promise<void> {
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

export default Users;
