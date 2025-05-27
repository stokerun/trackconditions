import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const SHOPIFY_PAGE_ID = process.env.SHOPIFY_PAGE_ID;
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const shopifyFetch = async (query) => {
  const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-04/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN
    },
    body: JSON.stringify({ query })
  });
  return response.json();
};

const getFormattedTimestamp = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

app.post('/update-track-report', async (req, res) => {
  const message = req.body.message;

  // ⛔ Prevent updates without a meaningful message
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    console.log('⚠️ Skipping update: message missing or too short.');
    return res.status(204).send('No update made — message missing or invalid.');
  }

  console.log('📩 Incoming track report:', message);

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional track conditions announcer. Rewrite the user's message into a clear, friendly, and informative public-facing update that will be posted on a motocross website.

**Do not assume the current day.** If the user's message references "Sunday" or other dates, treat them as written — do not substitute or update them. Only mention the actual day if the user does.

Preserve the user's tone and intent, including past tense when talking about previous days or events. Do not replace or reword phrases like "Sunday was perfect" unless clarity is needed.

Only use this structure:
- Start with a short intro or summary sentence (only if the user didn’t already write one).
- Then format key points as bullet points (keep the user's natural phrasing).
- Add emojis if relevant (not required).
- Finish with “Thank you for your attention!” unless the user closed the message differently.

Keep your tone informative and respectful. Do not use hype or slang. Be accurate and helpful.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const rewritten = chat.choices[0].message.content.trim();
    const timestamp = getFormattedTimestamp();

    console.log('✨ Rewritten report:', rewritten);

    const shopifyResponse = await shopifyFetch(`
      mutation metafieldsSet {
        metafieldsSet(metafields: [
          {
            key: "track_conditions",
            namespace: "custom",
            ownerId: "${SHOPIFY_PAGE_ID}",
            type: "multi_line_text_field",
            value: ${JSON.stringify(rewritten)}
          },
          {
            key: "track_conditions_updated_at",
            namespace: "custom",
            ownerId: "${SHOPIFY_PAGE_ID}",
            type: "multi_line_text_field",
            value: ${JSON.stringify(timestamp)}
          }
        ]) {
          metafields {
            id
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

    console.log('🔧 Shopify response:', JSON.stringify(shopifyResponse, null, 2));
    res.send('Track report rewritten and updated in Shopify');
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).send('Something went wrong');
  }
});

app.get('/ping', (req, res) => {
  console.log(`📡 Ping received at ${new Date().toISOString()}`);
  res.status(200).send('✅ Ping OK');
});

app.listen(PORT, () => {
  console.log(`🔥 Listening on port ${PORT}`);
});
