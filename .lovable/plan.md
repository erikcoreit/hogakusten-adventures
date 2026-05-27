# Höga Kusten Micro Adventures

Mobil-först webbapp för korta friluftsupplevelser i Örnsköldsvik/Höga Kusten. Besökare utforskar utan konto, inloggade bidrar.

## Design

Bas: vald riktning **High Coast Granite** (v3) – Inter + JetBrains Mono, skarpa kanter, sticky bottom-CTA, monospace-etiketter.

Palett anpassad till skogston från din referensbild:
- Bakgrund: varm off-white (`#f5f3ee`)
- Foreground/ink: djup skogsgrön-svart (`#1a2418`)
- Primary (CTA, accent): mossgrön (`#5a7a2e`)
- Secondary: barkbrun (`#8b6f47`)
- Muted: dimmig grågrön (`#6b7560`)

Allt definieras som `oklch`-tokens i `src/styles.css`. Två genererade hero-bilder (skogsstig, klippkust) i `src/assets/`.

Tvåspråkigt UI (SV/EN) via enkel i18n-kontext + språkväljare i headern. Innehåll (titlar/beskrivningar) lagras på bidragets språk – ingen översättning.

## Sidkarta (TanStack Router)

Publika:
- `/` – Hero + featured + CTA till utforska/bidra
- `/utforska` – Karta + lista med filter (toggle, mobil-först)
- `/aventyr/$id` – Detaljsida med bild, beskrivning, taggar, "Öppna i Google Maps", rapportera-knapp
- `/om` – Kort intro
- `/logga-in`, `/registrera`, `/aterstall-losenord`, `/reset-password`

Inloggade (`/_authenticated/...`):
- `/mina-aventyr` – Lista över egna bidrag med status
- `/skapa` – Steg-för-steg-formulär (1. Grundinfo → 2. Plats på karta → 3. Detaljer & taggar → 4. Bild → 5. Granska)
- `/redigera/$id` – Redigera utkast/rejected
- `/favoriter`

Admin (`/_authenticated/admin/...`):
- `/admin` – Dashboard
- `/admin/granska` – Pending mikroäventyr
- `/admin/rapporter` – Rapporter
- `/admin/taggar` – Hantera taggar & kategorier

## Backend (Lovable Cloud)

### Tabeller

**profiles** – `id` (=auth.users.id, PK), `display_name`, `created_at`

**user_roles** – separat tabell (säker rollhantering). Enum `app_role`: `contributor`, `moderator`, `admin`. Alla nya användare får automatiskt `contributor` via trigger på `auth.users`.

**adventure_tags** – `id`, `slug`, `label_sv`, `label_en`, `kind` ('category' | 'tag'). Seedas med kategorier (vandring, kajak, cykel…) och attribut (barnvänligt, hundvänligt, utan_bil, bad, utsikt, eldplats, nara_centrum).

**micro_adventures** – `id`, `author_id`, `title`, `description`, `lat`, `lng`, `address`, `duration_minutes`, `difficulty` (enum: latt/medel/utmanande), `season` (array), `image_url`, `status` (enum: draft/pending/published/rejected/archived), `rejection_note`, `published_at`, `created_at`, `updated_at`, `language`.

**adventure_tag_links** – `adventure_id`, `tag_id` (composite PK)

**favorites** – `user_id`, `adventure_id` (composite PK), `created_at`

**reports** – `id`, `adventure_id`, `reporter_id`, `reason`, `details`, `status` ('open'/'resolved'/'dismissed'), `created_at`

### Storage
Bucket `adventure-images` (public read). Upload endast av inloggade till `userId/...`.

### RLS (säkerhetsregler)

`has_role(uid, role)` SECURITY DEFINER för att undvika rekursion.

- **micro_adventures**: anon+auth läser där `status='published'`; författaren läser egna oavsett status; moderator/admin läser allt. INSERT av auth med `author_id=auth.uid()` och `status IN ('draft','pending')`. UPDATE av författare endast när nuvarande status är `draft` eller `rejected`, och endast till samma status eller `pending`. Moderator/admin UPDATE allt.
- **profiles**: alla läser; user uppdaterar egen.
- **user_roles**: läses av ägaren och admin; endast admin skriver.
- **favorites/reports**: ägaren skriver/läser sina egna; admin/moderator läser alla rapporter.
- **tags/links**: alla läser; admin skriver tags; författare/admin skriver links för egna äventyr.

Storage RLS på `adventure-images`: public select; insert/update/delete bara i egen mapp.

GRANTs sätts explicit på alla public-tabeller.

### Server-funktioner (TanStack `createServerFn`)
- `submitForReview(id)` – auth-skyddad, byter draft→pending för eget bidrag
- `moderateAdventure({id, action: approve|reject|archive, note?})` – moderator/admin via `supabaseAdmin`
- `resolveReport(...)`, `toggleAdventureHidden(...)`

Vanliga läsningar (lista, detalj, kartdata) sker direkt via browser-Supabase med RLS.

## Karta

Google Maps Platform via befintlig konnektor.
- Maps JavaScript API i browser (browser-key, `loading=async`, `callback=initMap`), `google.maps.Marker` (ej AdvancedMarker, ej mapId).
- "Öppna i Google Maps"-knapp = djuplänk `https://www.google.com/maps/dir/?api=1&destination=lat,lng`.
- Plats-väljaren i skapa-formuläret: klick på karta sätter marker → lat/lng. Reverse-geocode via gateway (`/maps/api/geocode/json`) i serverfunktion för adress.

## Flöden

**Bidra**: contributor fyller i steg-för-steg → kan "Spara utkast" när som helst → "Skicka för granskning" sätter `pending` → admin ser i `/admin/granska` → approve sätter `published` + `published_at`, reject sätter `rejected` + `rejection_note`. Contributor kan redigera draft/rejected och skicka in igen.

**Rapport**: inloggad klickar "Rapportera" på published äventyr → modal med anledning → rad i `reports` → admin hanterar.

**Favoriter**: hjärta på kort/detaljsida (auth-krävs, annars redirect till login).

## Tekniska detaljer

- TanStack Start + TanStack Query (`ensureQueryData` i loader, `useSuspenseQuery` i komponent)
- `_authenticated` layout-route med `beforeLoad`-redirect till `/logga-in`
- `attachSupabaseAuth` i `src/start.ts` så bearer token följer med
- Inloggning: Google (via Lovable broker + `configure_social_auth(['google'])`) + e-post/lösenord. Förste admin promotas manuellt via SQL efter du registrerat dig.
- Zod-validering på alla serverFn inputs
- Trigger `on_auth_user_created` skapar profile-rad och `user_roles`-rad med `contributor`
- shadcn/ui-komponenter (Button, Dialog, Sheet, Form, Select, Tabs) med varianter mot designtokens
- Mobil bottom-nav på inloggade vyer

## Vad jag INTE bygger nu

- Push-notiser, e-postnotiser vid moderation (kan läggas till senare)
- Routes/Directions API (bara djuplänk till Google Maps)
- Översättning av användarinnehåll
- Offlinekarta / nedladdning
