const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'pi_lottery';

exports.handler = async function(event, context) {
  const { uid } = JSON.parse(event.body || '{}');

  if (!uid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing UID' }),
    };
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const user = await db.collection('users').findOne({ uid });

    return {
      statusCode: 200,
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
