import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/om")({
  head: () => ({ meta: [{ title: "Om – Höga Kusten Micro Adventures" }] }),
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
