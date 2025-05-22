import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

app.post('/update-track-report', async (req, res) => {
  const message = req.body.body || 'No track update provided.';

  console.log(`📩 Incoming track report: ${message}`);

  try {
    const result = await updateShopify(message);
    console.log('🔧 Shopify response:', JSON.stringify(result, null, 2));
    res.status(200).send('Track report updated in metafield');
  } catch (err) {
    console.error('❌ Shopify update failed:', err);
    res.status(500).send('Error updating metafield');
  }
});

async function updateShopify(message) {
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_TOKEN;
  const ownerId = process.env.SHOPIFY_PAGE_ID; // Actually the Shop GID now!

  const mutation = `
    mutation metafieldsSet {
      metafieldsSet(metafields: [
        {
          namespace: "custom",
          key: "track_conditions",
          type: "multi_line_text_field",
          value: ${JSON.stringify(message)},
          ownerId: "${ownerId}"
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
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation }),
  });

  return await response.json();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Listening on port ${PORT}`);
});
