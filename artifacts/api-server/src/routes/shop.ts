import { Router } from "express";
import { CATEGORY_META } from "../lib/game-data";

const router = Router();

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const API_VERSION = "2025-04";

function shopifyConfigured(): boolean {
  return Boolean(domain && token);
}

async function storefrontFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token!,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  if (!json.data) throw new Error("No data returned");
  return json.data;
}

router.get("/shop/info", async (req, res) => {
  if (!shopifyConfigured()) {
    res.json({ name: "Fashion District", description: null });
    return;
  }
  try {
    const data = await storefrontFetch<{ shop: { name: string; description: string | null } }>(
      `query ShopInfo { shop { name description } }`,
    );
    res.json({ name: data.shop.name || "Fashion District", description: data.shop.description });
  } catch {
    res.json({ name: "Fashion District", description: null });
  }
});

router.get("/shop/categories", async (req, res) => {
  if (!shopifyConfigured()) {
    res.json(CATEGORY_META.map((m) => ({ ...m, products: [] })));
    return;
  }
  try {
    const COLLECTIONS_QUERY = `query ShopByCollections {
      nodes: collections(first: 20) {
        edges {
          node {
            handle
            products(first: 24) {
              edges {
                node {
                  id title availableForSale
                  featuredImage {
                    thumb: url(transform: { maxWidth: 300, maxHeight: 300 })
                    large: url(transform: { maxWidth: 1400, maxHeight: 1400 })
                    altText
                  }
                  priceRange { minVariantPrice { amount currencyCode } }
                  variants(first: 1) { edges { node { id availableForSale } } }
                }
              }
            }
          }
        }
      }
    }`;

    // @ts-ignore
    const data = await storefrontFetch<any>(COLLECTIONS_QUERY);
    const byHandle = new Map<string, any[]>();
    for (const edge of data.nodes.edges) {
      byHandle.set(edge.node.handle, edge.node.products.edges.map((e: any) => e.node));
    }

    const categories = CATEGORY_META.map((meta) => ({
      ...meta,
      products: (byHandle.get(meta.handle) ?? []).map((node: any) => {
        const variant = node.variants.edges[0]?.node;
        const money = node.priceRange.minVariantPrice;
        const value = Number.parseFloat(money.amount);
        return {
          id: node.id,
          name: node.title,
          price: value,
          priceFormatted: new Intl.NumberFormat("en-US", { style: "currency", currency: money.currencyCode, maximumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value),
          image: node.featuredImage?.thumb ?? null,
          imageLarge: node.featuredImage?.large ?? node.featuredImage?.thumb ?? null,
          variantId: variant?.id ?? "",
          available: node.availableForSale && (variant?.availableForSale ?? false),
          swatch: meta.swatch,
        };
      }),
    }));
    res.json(categories);
  } catch {
    res.json(CATEGORY_META.map((m) => ({ ...m, products: [] })));
  }
});

router.post("/checkout", async (req, res) => {
  if (!shopifyConfigured()) {
    res.json({ ok: false, error: "Store is not connected yet." });
    return;
  }

  const { lines } = req.body ?? {};
  if (!Array.isArray(lines) || lines.length === 0) {
    res.json({ ok: false, error: "Your bag is empty." });
    return;
  }

  const CART_CREATE = `mutation CreateCart($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { checkoutUrl }
      userErrors { message }
    }
  }`;

  try {
    // @ts-ignore
    const data = await storefrontFetch<any>(CART_CREATE, { lines });
    const errors = data.cartCreate.userErrors;
    if (errors.length > 0) {
      res.json({ ok: false, error: errors.map((e: any) => e.message).join(" ") });
      return;
    }
    const url = data.cartCreate.cart?.checkoutUrl;
    if (!url) {
      res.json({ ok: false, error: "Could not start checkout. Please try again." });
      return;
    }
    const checkoutUrl = new URL(url);
    checkoutUrl.searchParams.set("channel", "online_store");
    res.json({ ok: true, url: checkoutUrl.toString() });
  } catch (err) {
    req.log.error({ err }, "checkout error");
    res.json({ ok: false, error: "Something went wrong starting checkout." });
  }
});

export default router;
