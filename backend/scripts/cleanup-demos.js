
const { Client } = require('pg');

async function cleanupDemos() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Find demo users created more than 15 minutes ago
    const demoUsers = await client.query(`
      SELECT id
      FROM users
      WHERE email LIKE 'demo-%'
        AND created_at < NOW() - INTERVAL '15 minutes'
      FOR UPDATE
    `);

    const userIds = demoUsers.rows.map(user => user.id);

    if (userIds.length === 0) {
      await client.query('COMMIT');
      console.log('No expired demo users found.');
      return;
    }

    // Delete all entries associated with expired demo users
    const entriesResult = await client.query(`
      DELETE FROM entries
      WHERE user_id = ANY($1)
    `, [userIds]);

    // Delete the expired demo users themselves
    const usersResult = await client.query(`
      DELETE FROM users
      WHERE id = ANY($1)
    `, [userIds]);

    await client.query('COMMIT');

    console.log(
      `Cleanup complete: Deleted ${usersResult.rowCount} users ` +
      `and ${entriesResult.rowCount} entries.`
    );

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Demo cleanup failed:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

cleanupDemos();
