"use client";

import * as React from "react";
import { AlertCircle, Search } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ProductCard } from "@/components/marketing/product-card";
import { SplitHero } from "@/components/marketing/split-hero";
import { Section } from "@/components/marketing/marketing-ui";
import { WHATSAPP_URL } from "@/components/marketing/whatsapp-link";
import { cn } from "@/lib/utils";
import {
  fetchCatalog,
  fetchCatalogCategories,
  type CatalogCategory,
  type PublicProduct,
} from "@/lib/catalog";

export default function CatalogoPage() {
  const [categories, setCategories] = React.useState<CatalogCategory[]>([]);
  const [categoryId, setCategoryId] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [products, setProducts] = React.useState<PublicProduct[]>([]);
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    fetchCatalogCategories().then(setCategories).catch(() => {});
  }, []);

  // debounce de la busqueda; al cambiar el termino se vuelve a la pagina 1
  React.useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const pickCategory = (id: number | null) => {
    setCategoryId(id);
    setPage(1);
  };

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetchCatalog({ category_id: categoryId ?? undefined, q: query || undefined, page });
        if (cancelled) return;
        setProducts((prev) =>
          page === 1
            ? res.data
            : [...prev, ...res.data.filter((p) => !prev.some((x) => x.id === p.id))],
        );
        setLastPage(res.meta.last_page);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [categoryId, query, page]);

  return (
    <MarketingLayout>
      <SplitHero
        eyebrow="Catálogo"
        title="Farmacia & Productos Veterinarios"
        lead="Explora nuestro catálogo de medicamentos y productos veterinarios, arma tu lista y solicita cotización o disponibilidad."
        image="/gallery/illustrations/illustration-1.png"
        imageAlt="Profesional de farmacia hospitalaria"
        actions={
          <>
            <CtaLink href="/catalogo/cotizacion" variant="cta">
              Solicitar cotización
            </CtaLink>
            <CtaLink href={WHATSAPP_URL} variant="outline">
              Escríbenos por WhatsApp
            </CtaLink>
          </>
        }
      />

      <Section className="bg-[#f9fafb] pt-4 sm:pt-0">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => pickCategory(null)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                categoryId === null ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
              )}
            >
              Todo
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => pickCategory(category.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  categoryId === category.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
          <label className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o SKU"
              aria-label="Buscar en el catálogo"
              className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-10 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" /> No se pudo cargar el catálogo. Recarga la página.
          </div>
        ) : loading && products.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">Cargando catálogo...</p>
        ) : products.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No hay productos que coincidan con tu búsqueda.</p>
        ) : (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {page < lastPage ? (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="inline-flex h-11 items-center rounded-full border-2 border-current px-6 text-sm font-semibold disabled:opacity-60"
                >
                  {loading ? "Cargando..." : "Ver más productos"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </Section>
    </MarketingLayout>
  );
}
