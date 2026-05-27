import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sidan finns inte.</p>
        <Link to="/" className="mt-6 inline-flex rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Till startsidan</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Något gick fel</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Försök igen</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Höga Kusten Micro Adventures" },
      { name: "description", content: "Hitta korta friluftsupplevelser i Örnsköldsvik och Höga Kusten. Community-drivna mikroäventyr på karta och i lista." },
      { property: "og:title", content: "Höga Kusten Micro Adventures" },
      { property: "og:description", content: "Hitta korta friluftsupplevelser i Örnsköldsvik och Höga Kusten. Community-drivna mikroäventyr på karta och i lista." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Höga Kusten Micro Adventures" },
      { name: "twitter:description", content: "Hitta korta friluftsupplevelser i Örnsköldsvik och Höga Kusten. Community-drivna mikroäventyr på karta och i lista." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bf0e29f4-a795-4bae-a720-760cb9afa710/id-preview-675297e5--2c810529-fa64-426d-9b21-a5063ecfcfe5.lovable.app-1779866101550.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bf0e29f4-a795-4bae-a720-760cb9afa710/id-preview-675297e5--2c810529-fa64-426d-9b21-a5063ecfcfe5.lovable.app-1779866101550.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel: "icon", type: "image/png", href: "/favicon.png?v=2" }, { rel: "apple-touch-icon", href: "/favicon.png?v=2" }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
