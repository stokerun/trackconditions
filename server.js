import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

// Webhook route to receive updates
app.post('/update-track-report', async (req, res) => {
  const message = req.body.body || 'No message received';

  try {
    await updateShopify(message);
    res.status(200).send('Track report updated in metafield');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating metafield');
  }
});

// Function to update Shopify metafield
async function updateShopify(message) {
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_TOKEN;
  const pageId = process.env.SHOPIFY_PAGE_ID;

  const mutation = `
    mutation metafieldUpsert {
      metafieldUpsert(input: {
        namespace: "custom",
        key: "track_conditions",
        value: ${JSON.stringify(message)},
        type: "multi_line_text_field",
        ownerId: "${pageId}"
      }) {
        metafield {
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

  await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: mutation })
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Listening on port ${PORT}`));
