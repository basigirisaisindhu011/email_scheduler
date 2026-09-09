import { RedisMemoryServer } from 'redis-memory-server';

async function main() {
  console.log('Starting Redis Memory Server on port 6379...');
  const redisServer = new RedisMemoryServer({
    instance: {
      port: 6379,
    },
  });

  const host = await redisServer.getHost();
  const port = await redisServer.getPort();
  console.log(`Redis Memory Server running at ${host}:${port}`);
}

main().catch((err) => {
  console.error('Failed to start Redis Memory Server:', err);
});
