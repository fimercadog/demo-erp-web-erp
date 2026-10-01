import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { AppointmentCta } from "@/components/marketing/appointment-cta";
import { AuthorBlock } from "@/components/marketing/author-block";
import { formatDate } from "@/components/marketing/blog-card";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { adjacentPosts, blogPostBySlug, blogPosts, relatedPosts, teamBySlug } from "@/components/marketing/marketing-data";
import { Section } from "@/components/marketing/marketing-ui";
import { RelatedPosts } from "@/components/marketing/related-posts";
import { Reveal } from "@/components/marketing/reveal";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPostBySlug(slug);
  if (!post) notFound();

  const author = teamBySlug(post.authorSlug);
  const { prev, next } = adjacentPosts(post);
  const related = relatedPosts(post);

  return (
    <MarketingLayout>
      <Section className="pb-0">
        <div className="mx-auto max-w-3xl text-center">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <ArrowLeft className="size-4" /> Volver al blog
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-chart-4">{post.category}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">{post.title}</h1>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            {author && <span className="font-semibold text-foreground">{author.name}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" /> {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {post.readMinutes} min de lectura
            </span>
          </div>
        </div>
      </Section>

      <Section className="pt-10">
        <Reveal>
          <div className="relative aspect-21/9 w-full overflow-hidden rounded-4xl shadow-elevation-3">
            <Image src={post.image} alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-5xl gap-12 lg:grid-cols-[1fr_260px]">
          <article className="min-w-0 space-y-6 text-base leading-8 text-muted-foreground">
            {post.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {author && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Escrito por</p>
                <AuthorBlock author={author} />
              </div>
            )}
          </aside>
        </div>

        <div className="mx-auto mt-14 flex max-w-5xl flex-col gap-3 border-y border-border py-6 sm:flex-row sm:items-center sm:justify-between">
          {prev ? (
            <Link href={`/blog/${prev.slug}`} className="group flex items-center gap-2 text-sm">
              <ArrowLeft className="size-4 text-primary transition-transform group-hover:-translate-x-0.5" />
              <span className="text-muted-foreground">
                Anterior: <span className="font-semibold text-foreground">{prev.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/blog/${next.slug}`} className="group flex items-center gap-2 text-right text-sm sm:justify-end">
              <span className="text-muted-foreground">
                Siguiente: <span className="font-semibold text-foreground">{next.title}</span>
              </span>
              <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </Section>

      <Section className="bg-section-cream">
        <RelatedPosts posts={related} />
      </Section>

      <AppointmentCta
        title="¿Tienes dudas sobre la salud de tu mascota?"
        lead="Un artículo es informativo y no reemplaza la valoración médica. Agenda tu consulta con nuestros especialistas."
      />
    </MarketingLayout>
  );
}
