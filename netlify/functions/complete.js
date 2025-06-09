const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = 'pi_lottery';

exports.handler = async function (event) {
  const { paymentId, txid, uid, username } = JSON.parse(event.body || '{}');

  if (!paymentId || !txid || !uid || !username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing data' }),
    };
  }

  const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `key ${process.env.PI_API_KEY}`,
    },
    body: JSON.stringify({ txid }),
  });

  const piData = await piResponse.json();

  const winAmount = Math.floor(Math.random() * 100) + 1;

  try {
    await client.connect();
    const db = client.db(dbName);

    await db.collection('users').updateOne(
      { uid },
      { $set: { username }, $inc: { totalWins: winAmount }, $push: { history: { winAmount, txid, date: new Date() } } },
      { upsert: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'completed',
        win: winAmount,
        pi_response: piData,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
