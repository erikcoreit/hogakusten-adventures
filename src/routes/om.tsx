import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/om")({
  head: () => {
    const title = "Om appen – Höga Kusten Micro Adventures";
    const description = "Höga Kusten Micro Adventures är en community-driven karta över korta friluftsupplevelser i Örnsköldsvik och Höga Kusten.";
    const url = "https://hogakusten-adventures.lovable.app/om";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: About,
});

function About() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="label-mono text-primary">Om appen</p>
        <h1 className="mt-2 text-4xl font-bold">En karta för korta äventyr</h1>
        <div className="prose mt-6 space-y-4 text-base leading-relaxed text-foreground">
          <p>Höga Kusten Micro Adventures är en community-driven karta över korta friluftsupplevelser i Örnsköldsvik och Höga Kusten — vandringar, vyer, eldplatser, grottor, kajakturer, bad.</p>
          <p>Du behöver inget konto för att utforska. Vill du bidra med ditt eget tips, spara favoriter eller rapportera fel — då räcker en gratis inloggning.</p>
          <p>Alla nya bidrag granskas av moderatorer innan de publiceras.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
