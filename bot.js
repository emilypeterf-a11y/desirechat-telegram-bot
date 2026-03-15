import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE44_WEBHOOK = process.env.BASE44_WEBHOOK;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.get("/", (req, res) => {
  res.send("Bot rodando");
});

app.post("/telegram", async (req, res) => {

  const update = req.body;

  try {

    // USER ENVIOU /start
    if (update.message && update.message.text.startsWith("/start")) {

      const chatId = update.message.chat.id;

      const payload = update.message.text.split(" ")[1];

      if (!payload) {
        return res.sendStatus(200);
      }

      const parts = payload.split("_");

      const persona = parts[1];
      const amount = parseInt(parts[2]);

      await fetch(`${TELEGRAM_API}/sendInvoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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

    // TELEGRAM PEDINDO CONFIRMAÇÃO DO PAGAMENTO
    if (update.pre_checkout_query) {

      await fetch(`${TELEGRAM_API}/answerPreCheckoutQuery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pre_checkout_query_id: update.pre_checkout_query.id,
          ok: true
        })
      });

    }

    // PAGAMENTO CONFIRMADO
    if (update.message && update.message.successful_payment) {

      const payload = update.message.successful_payment.invoice_payload;

      await fetch(BASE44_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          payload: payload
        })
      });

    }

  } catch (err) {

    console.log(err);

  }

  res.sendStatus(200);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
