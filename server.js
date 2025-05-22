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
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: mutation })
  });
}
