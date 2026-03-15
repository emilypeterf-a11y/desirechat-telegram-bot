import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE44_WEBHOOK = process.env.BASE44_WEBHOOK;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.post("/telegram", async (req, res) => {

  const update = req.body;

  try {

    if (update.message?.text?.startsWith("/start")) {

      const chatId = update.message.chat.id;
      const payload = update.message.text.split(" ")[1];

      const parts = payload.split("_");
      const persona = parts[1];
      const amount = parseInt(parts[2]);

      await fetch(`${TELEGRAM_API}/sendInvoice`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          chat_id: chatId,
          title: `Chat com ${persona}`,
          description: "Acesso ao chat premium",
          payload: payload,
          provider_token: "",
          currency: "XTR",
          prices: [
            {
              label: "Acesso",
              amount: amount
            }
          ]
        })
      });

    }

    if (update.pre_checkout_query) {

      await fetch(`${TELEGRAM_API}/answerPreCheckoutQuery`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          pre_checkout_query_id: update.pre_checkout_query.id,
          ok: true
        })
      });

    }

    if (update.message?.successful_payment) {

      const payment = update.message.successful_payment;
      const payload = payment.invoice_payload;

      const telegramUser = update.message.from;

      await fetch(BASE44_WEBHOOK, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          telegram_id: telegramUser.id,
          payload: payload,
          charge_id: payment.telegram_payment_charge_id
        })
      });

    }

  } catch (err) {
    console.error(err);
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("Bot rodando");
});
