import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

app.post('/update-track-report', async (req, res) => {
  const message = req.body.body || 'No message received';

  const html = `
    <div class="track-report">
      <p>${message}</p>
      <p><em>Last updated: ${new Date().toLocaleString()}</em></p>
    </div>
  `;

  try {
    await updateShopify(html);
    res.status(200).send('Track report updated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating report');
  }
});

async function updateShopify(html) {
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_TOKEN;
  const pageId = process.env.SHOPIFY_PAGE_ID;

  const query = `
    mutation {
      pageUpdate(input: {
        id: "${pageId}",
        bodyHtml: ${JSON.stringify(html)}
      }) {
        page { id title }
        userErrors { field message }
      }
    }
  `;

  await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Listening on port ${PORT}`));

