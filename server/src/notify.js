// Notifications push directes (standard Web Push + clés VAPID), sans service tiers à configurer.
import webpush from "web-push";
import { query } from "./db.js";

let ready = false;

export function initPush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("⚠️  Clés VAPID absentes de .env : les notifications sont désactivées (voir GUIDE-INSTALLATION.md).");
    return;
  }
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:contact@palm-beauty.tn", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  ready = true;
  console.log("🔔 Notifications Web Push prêtes");
}

export const publicKey = () => (ready ? process.env.VAPID_PUBLIC_KEY : null);

const CLIENT_TEXT = {
  fr: {
    "confirmé": { title: "Rendez-vous confirmé ✅", body: "Le {date} à {time}. À bientôt chez Palm !" },
    "annulé": { title: "Rendez-vous annulé", body: "Votre rendez-vous du {date} à {time} a été annulé. Contactez-nous pour une autre date." },
    "terminé": { title: "Merci pour votre visite 🌿", body: "Au plaisir de vous revoir chez Palm Beauty Centre." },
    "modifié": { title: "Rendez-vous modifié 📅", body: "Nouveau créneau : le {date} à {time}." }
  },
  ar: {
    "confirmé": { title: "تأكّد موعدك ✅", body: "نهار {date} على {time}. نستناوك في Palm!" },
    "annulé": { title: "تمّ إلغاء موعدك", body: "موعدك نهار {date} على {time} تلغى. اتصلي بينا باش نختارو تاريخ آخر." },
    "terminé": { title: "يعطيك الصحة على الزيارة 🌿", body: "نتشرفو بيك ديما في Palm Beauty Centre." },
    "modifié": { title: "تبدّل موعدك 📅", body: "الموعد الجديد: نهار {date} على {time}." }
  }
};

async function sendToUsers(userIds, payload) {
  if (!ready || !userIds.length) return 0;
  const { rows } = await query("select endpoint, subscription from push_subscriptions where user_id = any($1)", [userIds]);
  let sent = 0;
  await Promise.all(rows.map(async ({ endpoint, subscription }) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 86400, urgency: "high" });
      sent++;
    } catch (err) {
      // Appareil désabonné ou expiré : on l'oublie.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await query("delete from push_subscriptions where endpoint = $1", [endpoint]);
      } else {
        console.error("Push :", err.statusCode, err.body || err.message);
      }
    }
  }));
  return sent;
}

// Une cliente réserve ou annule -> tous les comptes admin sont prévenus.
export async function notifyAdmins(booking, event) {
  const { rows } = await query("select id from users where role = 'admin'");
  const cancelled = event === "status" && booking.status === "annulé";
  const services = booking.services.map((s) => s.name).join(", ");
  return sendToUsers(rows.map((r) => r.id), {
    title: cancelled ? "❌ Rendez-vous annulé par la cliente" : "📅 Nouvelle réservation",
    body: `${booking.name} – ${booking.date} à ${booking.time}` + (services ? `\n${services}` : ""),
    url: "admin.html",
    tag: "booking-" + booking.id
  });
}

// Le centre change le statut ou le créneau -> la cliente est prévenue dans sa langue.
export async function notifyClient(booking, kind = booking.status) {
  const text = (CLIENT_TEXT[booking.lang] ?? CLIENT_TEXT.fr)[kind];
  if (!booking.user_id || !text) return 0;
  const fill = (s) => s.replace("{date}", booking.date).replace("{time}", booking.time);
  return sendToUsers([booking.user_id], {
    title: text.title,
    body: fill(text.body),
    url: "index.html#compte",
    tag: "booking-" + booking.id
  });
}

// N'interrompt jamais la requête si l'envoi échoue.
export const safely = (promise) => promise.catch((err) => console.error("Notification :", err.message));
