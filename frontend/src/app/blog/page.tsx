"use client";

import * as React from "react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { SplitHero } from "@/components/marketing/split-hero";
import { Section } from "@/components/marketing/marketing-ui";
import { BlogCard, FeaturedPost } from "@/components/marketing/blog-card";
import { blogCategories, blogPosts } from "@/components/marketing/marketing-data";
import { cn } from "@/lib/utils";

export default function BlogPage() {
  const [category, setCategory] = React.useState<string | null>(null);

  const [featured, ...rest] = blogPosts;
  const filtered = category ? rest.filter((p) => p.category === category) : rest;
  const showFeatured = !category || category === featured.category;

  return (
    <MarketingLayout>
      {/* Hero: misma familia visual que Servicios -- para que el blog se sienta
          parte del mismo sitio, no una seccion aparte. */}
      <SplitHero
        eyebrow="Blog"
        title="Cuidado animal, explicado por el equipo que te atiende"
        lead="Prevención, vacunas, nutrición y qué hacer ante una urgencia — notas prácticas para dueños de mascota, escritas por nuestros veterinarios."
        image="/gallery/illustrations/illustration-10.png"
        imageAlt="Gato sobre una laptop junto a un botiquín de primeros auxilios"
      />

      <Section className="bg-[#f9fafb] pt-0">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              category === null ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
            )}
          >
            Todas
          </button>
          {blogCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {showFeatured && (
          <div className="mt-12">
            <FeaturedPost post={featured} />
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, i) => (
            <BlogCard key={post.slug} post={post} delay={(i % 3) * 0.1} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">No hay artículos en esta categoría todavía.</p>
        )}
      </Section>
    </MarketingLayout>
  );
}
