const fetch = require('node-fetch');

exports.handler = async function (event) {
  const { paymentId } = JSON.parse(event.body || '{}');

  if (!paymentId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing paymentId' }),
    };
  }

  const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `key ${process.env.PI_API_KEY}`,
    },
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
