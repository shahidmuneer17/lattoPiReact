const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { uid, username } = body;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('pi_lottery');
  const users = db.collection('users');

  const existingUser = await users.findOne({ uid });

  if (!existingUser) {
    await users.insertOne({
      uid,
      username,
      createdAt: new Date(),
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ uid, username }),
  };
};
