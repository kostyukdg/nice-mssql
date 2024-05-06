import { QueryRepository, Int, NVarChar } from '../../src';

const fields = ' users.id, users.name ';

export interface User {
  id: number;
  name: string;
}

export class UsersRepository extends QueryRepository {
  async findOneById(id: User['id']): Promise<User | null> {
    let user = null;
    const queryResult = await this.getRequest().input('id', Int, id)
      .query<User>(`
          SELECT
            ${fields}
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

  async findAll(): Promise<User[]> {
    const queryResult = await this.getRequest().query<User>(
      `SELECT ${fields} FROM users`,
    );
    return queryResult.recordset;
  }

  async add(id: User['id'], name: User['name']): Promise<void> {
    await this.getRequest().input('id', Int, id).input('name', NVarChar, name)
      .query(`
          INSERT INTO users (
            ${fields}
          )
          VALUES
          (
            @id,
            @name
          )
      `);
  }

  async updateNameById(id: User['id'], name: User['name']): Promise<void> {
    await this.getRequest().input('id', Int, id).input('name', NVarChar, name)
      .query(`
          UPDATE
            users
          SET
            name = @name,
          WHERE
            id = @id
      `);
  }
}

export default UsersRepository;
