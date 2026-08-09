import type { Metadata } from "next";
import ProductCard from "@/components/products/ProductCard";
import Reveal from "@/components/ui/Reveal";
import { getAllProducts } from "@/db/queries";

export const revalidate = 3600;

const title = "Products — CodedDevs Technology LTD";
const description =
  "Software built for African markets. See what CodedDevs is building.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://codeddevs.com/products",
    siteName: "CodedDevs Technology LTD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function ProductsPage() {
  const products = await getAllProducts();
  const isDev = process.env.NODE_ENV === "development";

  return (
    <main id="main">
      <section className="pagehead">
        <div className="rail">
          <p className="eyebrow">Products</p>
          <h1>What we build</h1>
          <p className="pagehead__sub">
            Every product starts from a problem we have watched people work
            around. We ship the ones we can carry properly.
          </p>
          {products.length > 0 ? (
            <p className="pagehead__count">
              {products.length}{" "}
              {products.length === 1 ? "product" : "products"}
            </p>
          ) : null}
        </div>
      </section>

      <section className="band">
        <div className="rail">
          {products.length > 0 ? (
            <div className="prodrows">
              {products.map((product, index) => (
                <Reveal key={product.id}>
                  <ProductCard
                    product={product}
                    variant="row"
                    reversed={index % 2 === 1}
                    priority={index === 0}
                  />
                </Reveal>
              ))}
            </div>
          ) : isDev ? (
            <p className="emptystate">
              No products yet — add one via the admin dashboard.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
