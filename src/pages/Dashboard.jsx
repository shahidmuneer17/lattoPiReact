import { useEffect, useState } from 'react';

export default function Dashboard({ uid }) {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetch('/.netlify/functions/get-user-data', {
      method: 'POST',
      body: JSON.stringify({ uid })
    })
      .then(res => res.json())
      .then(data => setTickets(data));
  }, [uid]);

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl font-bold mb-4">Your Scratch Tickets</h1>
      {tickets.map(t => (
        <div key={t._id} className="bg-purple-800 p-3 mb-2 rounded">
          🎉 Won: {t.win} π
        </div>
      ))}
    </div>
  );
}
