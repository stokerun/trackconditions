import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/update-track-report', async (req, res) => {
  const message = req.body.body || 'No message received';
  console.log("📩 Incoming track report:", message);

  try {
    await updateShopify(message);
    res.status(200).send('Track report updated in metafield');
  } catch (err) {
    console.error("❌ Error updating metafield:", err);
    res.status(500).send('Error updating metafield');
  }
});

// Shopify GraphQL mutation to update metafield
async function updateShopify(message) {
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_TOKEN;
  const pageId = process.env.SHOPIFY_PAGE_ID;

  const mutation = `
    mutation metafieldsSet {
      metafieldsSet(metafields: [
        {
          namespace: "custom",
          key: "track_conditions",
          type: "multi_line_text_field",
          value: ${JSON.stringify(message)},
          ownerId: "${pageId}"
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
  `;

  const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: mutation })
  });

  const result = await response.json();
  console.log("🔧 Shopify response:", JSON.stringify(result, null, 2));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Listening on port ${PORT}`));
