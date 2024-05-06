import { createServer } from 'node:http';
import {
  getRepository,
  UsersRepository,
  User,
  connectToMssql,
} from './repositories';

const PORT = process.env.PORT || 3000;

(async () => {
  // Connect before using mssql
  await connectToMssql({
    user: 'xxx',
    password: 'xxxx',
    server: '127.0.0.1',
    database: 'db_name',
    port: 1433,
  });

  const server = createServer(async (request, response) => {
    if (request.url === '/user') {
      const user: User | null =
        await getRepository(UsersRepository).findOneById(11);

      // Different way of using
      const usersRepository = new UsersRepository();
      await usersRepository.add(22, 'Lily');
      const addedUser = usersRepository.findOneById(22);
      if (addedUser !== null) {
        console.log('Added user exists');
      }

      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(user));
    }
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
