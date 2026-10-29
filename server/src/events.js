// Mises à jour en direct (Server-Sent Events) : la liste admin et "Mes rendez-vous"
// se rafraîchissent dès qu'une réservation change, sans recharger la page.
const clients = new Set();

export function subscribe(req, res, user) {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.flushHeaders();
  res.write("retry: 5000\n\n");

  const client = { res, user };
  clients.add(client);
  // Garde la connexion ouverte derrière les proxys des hébergeurs.
  const ping = setInterval(() => res.write(": ping\n\n"), 25000);
  req.on("close", () => {
    clearInterval(ping);
    clients.delete(client);
  });
}

// Prévient les admins et la cliente concernée.
export function broadcastBooking(booking) {
  const msg = `event: booking\ndata: ${JSON.stringify({ id: booking.id, status: booking.status })}\n\n`;
  for (const { res, user } of clients) {
    if (user.role === "admin" || user.id === booking.user_id) res.write(msg);
  }
}
