// server.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/update-track-report', async (req, res) => {
  const message = req.body.message || 'No message received';
  console.log('📩 Incoming track report:', message);

  try {
    // ✍️ Rewrite the track report using GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an energetic motocross announcer. Rewrite this track report in a short, bold, and hype tone for a daily update section on a motocross website. Make it sound rad but readable.'
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    const rewritten = completion.choices[0].message.content.trim();
    console.log('✨ Rewritten report:', rewritten);

    const metafieldPayload = {
      query: `
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id key value }
            userErrors { field message }
          }
        }
      `,
      variables: {
        metafields: [
          {
            key: 'track_conditions',
            namespace: 'custom',
            ownerId: process.env.SHOPIFY_PAGE_ID,
            type: 'single_line_text_field',
            value: rewritten
          }
        ]
      }
    };

    const response = await fetch(`https://${process.env.SHOPIFY_SHOP}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metafieldPayload)
    });

    const result = await response.json();
    console.log('🔧 Shopify response:', JSON.stringify(result, null, 2));

    res.status(200).send('Track report updated successfully');
  } catch (error) {
    console.error('❌ Error updating Shopify:', error);
    res.status(500).send('Something went wrong');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Listening on port ${PORT}`));
