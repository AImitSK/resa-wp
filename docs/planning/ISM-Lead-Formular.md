# ISM — Universelles Lead-Formular

## Konfiguration, Felder, Strategien & DSGVO

---

## 1. Die Herausforderung

Das Lead-Formular ist der **kritischste Moment** im gesamten Asset-Flow. Der Besucher hat 3-5 Fragen beantwortet, ist emotional investiert — und jetzt kommt die Hürde: persönliche Daten hergeben.

Jedes zusätzliche Feld kostet Conversion. Aber jedes fehlende Feld senkt die Lead-Qualität.

```
Wenige Felder                              Viele Felder
(nur E-Mail)                               (Name, Tel, Adresse, Budget...)

  Conversion: ★★★★★                         Conversion: ★★☆☆☆
  Lead-Qualität: ★★☆☆☆                      Lead-Qualität: ★★★★★
  Spam-Risiko: ★★★★★                        Spam-Risiko: ★☆☆☆☆
  Nachfass-Möglichkeit: ★★☆☆☆               Nachfass-Möglichkeit: ★★★★★
```

Verschiedene Makler verfolgen fundamental andere Strategien:

- **Der Conversion-Maximierer:** "Nur E-Mail, möglichst viele Leads, ich sortiere selbst"
- **Der Qualitäts-Fokussierte:** "Lieber weniger Leads, aber mit Telefon und Anliegen"
- **Der Newsletter-Bauer:** "Leads sind erstmal Kontakte, die ich langfristig bespielen will"
- **Der Sofort-Anrufer:** "Ich will den Lead sofort anrufen, Telefon ist Pflicht"

**ISM muss alle Strategien unterstützen** — über ein einziges, konfigurierbares Formular.

---

## 2. Grundprinzip: Ein Formular, ein Schritt

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ✅  So macht es ISM:                                    │
│                                                         │
│  Fragen → Fragen → Fragen → [FORMULAR] → Ergebnis      │
│                               ↑                         │
│                          EIN Schritt                    │
│                          ALLE Felder auf einmal          │
│                          Kein "weiter" im Formular      │
│                                                         │
│  ❌  NICHT so:                                           │
│                                                         │
│  Fragen → [E-Mail eingeben] → [Jetzt noch Name] → ...  │
│            ↑                    ↑                       │
│        Schritt 1            Schritt 2                   │
│        Fühlt sich wie Falle an                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Warum ein Schritt?**
- Ehrlichkeit: Der Besucher sieht sofort was gefragt wird
- Kein "Nachfordern" von Daten (fühlt sich manipulativ an)
- Schneller: Ein Klick auf "Ergebnis anzeigen" und fertig
- Klare Erwartung: "Gib mir das, dann bekommst du das"
- DSGVO-sauberer: Eine Einwilligung für alle Felder auf einmal

---

## 3. Feld-Katalog

Jedes Feld hat einen festen Slug, einen Typ und drei mögliche Zustände: **Pflicht**, **Optional** oder **Aus**.

```
Feld                Slug              Typ           Standard     Konfigurierbar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM-FELDER (immer da, nicht abschaltbar):

Vorname             first_name        text          Pflicht      Nein
E-Mail              email             email         Pflicht      Nein
DSGVO-Einwilligung  consent           checkbox      Pflicht      Nein

KONFIGURIERBARE FELDER:

Nachname            last_name         text          Optional     Ja
Telefon             phone             tel           Aus          Ja
Anrede              salutation        select        Aus          Ja
Firma               company           text          Aus          Ja
Straße + Nr.        street            text          Aus          Ja
PLZ                 zip               text          Aus          Ja
Ort                 city_input        text          Aus          Ja
Nachricht           message           textarea      Aus          Ja
Rückruf gewünscht   callback          checkbox      Aus          Ja
Newsletter          newsletter        checkbox      Aus          Ja

ASSET-SPEZIFISCHE FELDER (pro Asset konfigurierbar):

Objektart           property_type     select        Aus          Ja, pro Asset
Zeitrahmen          timeframe         select        Aus          Ja, pro Asset
Budget              budget_range      select        Aus          Ja, pro Asset
Eigentümer/Suchend  intent            select        Aus          Ja, pro Asset
```

### Feld-Zustände

```
Zustand        Bedeutung                          UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pflicht        Muss ausgefüllt werden              Rotes Sternchen *, 
               Formular blockiert ohne             Validierungsmeldung

Optional       Wird angezeigt, kann leer bleiben   Kein Sternchen,
               "(optional)" als Hinweis            Hilfstext

Aus            Wird nicht angezeigt                Feld existiert nicht
                                                   im Formular
```

---

## 4. Admin-Konfiguration

### 4.1 Globale Formular-Einstellungen

```
┌─────────────────────────────────────────────────────────────────┐
│  Einstellungen → Lead-Formular                                  │
│                                                                 │
│  Voreinstellung:  [▼ Balanced (Empfohlen)              ]       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  Feld               Status                              │    │
│  │  ─────────────────────────────────────────────────────  │    │
│  │  Vorname             ● Pflicht  (nicht änderbar)        │    │
│  │  E-Mail              ● Pflicht  (nicht änderbar)        │    │
│  │  DSGVO-Einwilligung  ● Pflicht  (nicht änderbar)        │    │
│  │  ─────────────────────────────────────────────────────  │    │
│  │  Nachname            ○ Pflicht  ● Optional  ○ Aus       │    │
│  │  Telefon             ○ Pflicht  ○ Optional  ● Aus       │    │
│  │  Anrede              ○ Pflicht  ○ Optional  ● Aus       │    │
│  │  Firma               ○ Pflicht  ○ Optional  ● Aus       │    │
│  │  Straße + Nr.        ○ Pflicht  ○ Optional  ● Aus       │    │
│  │  PLZ                 ○ Pflicht  ○ Optional  ● Aus       │    │
│  │  Ort                 ○ Pflicht  ○ Optional  ● Aus       │    │
│  │  Nachricht           ○ Pflicht  ○ Optional  ● Aus       │    │
│  │  Rückruf gewünscht   ○ Pflicht  ○ Optional  ● Aus       │    │
│  │  Newsletter          ○ Pflicht  ○ Optional  ● Aus       │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Feldreihenfolge:  [Per Drag & Drop sortierbar]                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ≡ Anrede                                               │    │
│  │  ≡ Vorname                                              │    │
│  │  ≡ Nachname                                             │    │
│  │  ≡ E-Mail                                               │    │
│  │  ≡ Telefon                                              │    │
│  │  ≡ Newsletter                                           │    │
│  │  ≡ DSGVO-Einwilligung                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Vorschau anzeigen]  [Speichern]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Voreinstellungen (Presets)

Statt jeden Makler alles manuell einstellen zu lassen, bietet ISM vorgefertigte Strategien:

```
┌─────────────────────────────────────────────────────────────────┐
│  Voreinstellung wählen:                                         │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │  ⚡ MINIMAL                              │                    │
│  │  Nur Vorname + E-Mail                   │                    │
│  │  Maximale Conversion, minimale Daten    │                    │
│  │  3 Felder total                         │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │  ⭐ BALANCED (Empfohlen)                 │                    │
│  │  Vorname + Nachname (opt.) + E-Mail     │                    │
│  │  + Telefon (opt.) + Newsletter (opt.)   │                    │
│  │  Gutes Gleichgewicht                    │                    │
│  │  5 Felder total (2 optional)            │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │  📞 QUALIFIZIERT                         │                    │
│  │  Vorname + Nachname + E-Mail + Telefon  │                    │
│  │  + Zeitrahmen + Rückruf                 │                    │
│  │  Weniger Leads, höhere Qualität         │                    │
│  │  6 Felder total (Telefon Pflicht)       │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │  🏢 GEWERBE                              │                    │
│  │  Anrede + Vorname + Nachname + Firma    │                    │
│  │  + E-Mail + Telefon                     │                    │
│  │  Für gewerbliche Immobilien             │                    │
│  │  6 Felder total                         │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │  ✏️ INDIVIDUELL                           │                    │
│  │  Alle Felder frei konfigurieren          │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Preset-Konfigurationen im Detail

```
Feld                 Minimal    Balanced    Qualifiziert    Gewerbe
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vorname              Pflicht    Pflicht     Pflicht         Pflicht
Nachname             Aus        Optional    Pflicht         Pflicht
E-Mail               Pflicht    Pflicht     Pflicht         Pflicht
Telefon              Aus        Optional    Pflicht         Pflicht
Anrede               Aus        Aus         Aus             Pflicht
Firma                Aus        Aus         Aus             Pflicht
Nachricht            Aus        Aus         Aus             Aus
Rückruf              Aus        Aus         Optional        Aus
Newsletter           Aus        Optional    Aus             Optional
DSGVO                Pflicht    Pflicht     Pflicht         Pflicht
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sichtbare Felder     3          5           6               6
Davon Pflicht        3          3           6               6
Davon Optional       0          2           0               0
```

### 4.3 Pro-Asset-Überschreibung (Premium)

Im Premium-Plan kann der Makler die globale Konfiguration **pro Asset überschreiben**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Smart Assets → Mietpreis-Kalkulator → Lead-Formular            │
│                                                                 │
│  ● Globale Einstellung verwenden (Balanced)                     │
│  ○ Für dieses Asset anpassen:                                   │
│                                                                 │
│    [gleiche Konfigurationsoberfläche wie global]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Anwendungsfall:** Der Mietpreis-Kalkulator zieht Vermieter an → wenige Felder (Conversion). Der Immobilienwert-Kalkulator zieht Verkäufer an → mehr Felder (Qualifizierung), inkl. Zeitrahmen "Wann möchten Sie verkaufen?".

---

## 5. Feld-Spezifikationen

### 5.1 Vorname (Pflicht, immer)

```
Slug:           first_name
Typ:            text
Label:          __( 'First name', 'ism' )
Placeholder:    __( 'Your first name', 'ism' )
Validierung:    Pflicht, min 2 Zeichen, max 50 Zeichen
Sanitizing:     sanitize_text_field(), trim, kein HTML
```

### 5.2 Nachname (konfigurierbar)

```
Slug:           last_name
Typ:            text
Label:          __( 'Last name', 'ism' )
Placeholder:    __( 'Your last name', 'ism' )
Hinweis:        __( '(optional)', 'ism' )  ← nur wenn Status = Optional
Validierung:    Wenn Pflicht: min 2 Zeichen. Wenn Optional: darf leer sein.
Sanitizing:     sanitize_text_field(), trim, kein HTML
```

### 5.3 E-Mail (Pflicht, immer)

```
Slug:           email
Typ:            email
Label:          __( 'Email address', 'ism' )
Placeholder:    __( 'your@email.com', 'ism' )
Validierung:    Pflicht, is_email(), RFC 5322 kompatibel
Sanitizing:     sanitize_email(), trim, lowercase
Besonderheit:   Wird für PDF-Versand und DOI verwendet
                Duplikat-Erkennung: Gleiche E-Mail + gleicher Asset → 
                kein neuer Lead, aber neues Ergebnis
```

### 5.4 Telefon (konfigurierbar)

```
Slug:           phone
Typ:            tel
Label:          __( 'Phone number', 'ism' )
Placeholder:    __( '+49 123 456789', 'ism' )
Hinweis:        __( 'For personal consultation', 'ism' ) ← Motivations-Text
Validierung:    Wenn Pflicht: min 6 Zeichen, nur Ziffern/+/-/Leerzeichen/Klammern
                Wenn Optional: darf leer sein
Sanitizing:     Nur erlaubte Zeichen behalten, trim
Format-Hilfe:   Automatische Formatierung beim Tippen (optional, landesabhängig)
```

**Besonderheit Telefon:** Viele Makler schwören auf Telefon als Pflichtfeld ("Wer keine Nummer angibt, ist kein ernsthafter Lead"). Andere sagen "Telefon als Pflicht killt 30% meiner Conversions". ISM lässt den Makler entscheiden.

### 5.5 Anrede (konfigurierbar)

```
Slug:           salutation
Typ:            select
Label:          __( 'Salutation', 'ism' )
Optionen:
  - ""                          ← Leer (Placeholder)
  - "mr"    → __( 'Mr.', 'ism' )
  - "mrs"   → __( 'Mrs.', 'ism' )
  - "div"   → __( 'Mx.', 'ism' )      ← Divers/Neutral
Validierung:    Wenn Pflicht: Auswahl erforderlich
Verwendung:     E-Mail-Anrede: "Sehr geehrter Herr Schmidt" vs. 
                "Guten Tag Maria Schmidt"
```

### 5.6 Firma (konfigurierbar)

```
Slug:           company
Typ:            text
Label:          __( 'Company', 'ism' )
Placeholder:    __( 'Company name', 'ism' )
Validierung:    Wenn Pflicht: min 2 Zeichen
Sanitizing:     sanitize_text_field()
Verwendung:     CRM-Übergabe, Lead-Qualifizierung (B2B vs. B2C)
```

### 5.7 Adresse: Straße, PLZ, Ort (konfigurierbar, gruppiert)

```
Slug:           street / zip / city_input
Typ:            text / text / text
Gruppierung:    Werden zusammen ein-/ausgeschaltet (ein Toggle für alle drei)
Layout:         Straße (volle Breite), PLZ + Ort nebeneinander

  ┌────────────────────────────────────────────┐
  │ Straße + Nr.                               │
  ├──────────────┬─────────────────────────────┤
  │ PLZ          │ Ort                          │
  └──────────────┴─────────────────────────────┘

Validierung:    Wenn Pflicht: Alle drei müssen ausgefüllt sein
Verwendung:     Persönliche Beratung, lokale Marktdaten
```

### 5.8 Nachricht (konfigurierbar)

```
Slug:           message
Typ:            textarea
Label:          __( 'Your message', 'ism' )
Placeholder:    __( 'Questions or comments (optional)', 'ism' )
Max Zeichen:    500
Zeilen:         3 (Standard)
Validierung:    Wenn Pflicht: min 10 Zeichen
Sanitizing:     sanitize_textarea_field(), strip_tags()
```

### 5.9 Rückruf gewünscht (konfigurierbar)

```
Slug:           callback
Typ:            checkbox
Label:          __( 'I would like a personal callback', 'ism' )
Abhängigkeit:   Wenn aktiv UND Telefon = Aus → Telefon wird 
                automatisch auf Optional gesetzt (mit Admin-Hinweis)
Wirkung:        Setzt Tag "callback-requested" am Lead
                Makler-Benachrichtigung wird als "dringend" markiert
```

### 5.10 Newsletter (konfigurierbar)

```
Slug:           newsletter
Typ:            checkbox
Label:          Konfigurierbar, Standard:
                __( 'Yes, I would like to receive market updates by email', 'ism' )
Vorausgewählt:  NEIN (DSGVO: Opt-In muss aktiv erfolgen)
Wirkung:        Wenn angehakt:
                → Lead bekommt Tag "newsletter-optin"
                → Wird an Newsletter-Integration weitergeleitet
                  (CleverReach, Brevo etc. — wenn Add-on aktiv)
                → Separater DOI-Prozess für Newsletter
                  (unabhängig vom Ergebnis-PDF-Versand)
```

**DSGVO-Kritisch:** Newsletter-Opt-In ist eine **separate Einwilligung**, getrennt von der allgemeinen DSGVO-Consent-Checkbox. Der Besucher willigt in die Datenverarbeitung ein (Pflicht-Checkbox) UND kann optional dem Newsletter zustimmen.

### 5.11 DSGVO-Einwilligung (Pflicht, immer)

```
Slug:           consent
Typ:            checkbox
Label:          Konfigurierbar, Standard:
                __( 'I agree that my data will be processed to provide 
                     the requested analysis. [Privacy Policy]', 'ism' )
Link:           Verlinkt auf die Datenschutzseite des Maklers
                (Einstellung: URL zur Datenschutzerklärung)
Vorausgewählt:  NEIN (DSGVO: muss aktiv angehakt werden)
Validierung:    Pflicht — Formular kann nicht abgesendet werden ohne
Speicherung:    consent = true + consent_date = NOW() in DB
```

---

## 6. Frontend-Rendering

### 6.1 Formular-Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Ihre Ergebnisse sind fertig!                           │
│  Tragen Sie Ihre Daten ein, um Ihre persönliche         │
│  Analyse zu erhalten.                                   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  ┌──────────┐                                     │  │  ← Anrede (wenn aktiv)
│  │  │ Anrede ▼ │                                     │  │
│  │  └──────────┘                                     │  │
│  │                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────────────┐ │  │  ← Vor/Nachname
│  │  │ Vorname *       │  │ Nachname (optional)     │ │  │     nebeneinander
│  │  └─────────────────┘  └─────────────────────────┘ │  │
│  │                                                   │  │
│  │  ┌───────────────────────────────────────────────┐ │  │
│  │  │ E-Mail-Adresse *                              │ │  │
│  │  └───────────────────────────────────────────────┘ │  │
│  │                                                   │  │
│  │  ┌───────────────────────────────────────────────┐ │  │  ← Telefon (wenn aktiv)
│  │  │ 📞 Telefon (für persönliche Beratung)         │ │  │
│  │  └───────────────────────────────────────────────┘ │  │
│  │                                                   │  │
│  │  ☐ Ja, ich möchte Marktberichte per E-Mail        │  │  ← Newsletter (wenn aktiv)
│  │                                                   │  │
│  │  ☑ Ich stimme der Verarbeitung meiner Daten       │  │  ← DSGVO (immer)
│  │    gemäß der Datenschutzerklärung zu. *            │  │
│  │                                                   │  │
│  │  ┌───────────────────────────────────────────────┐ │  │
│  │  │          Ergebnis anzeigen →                   │ │  │
│  │  └───────────────────────────────────────────────┘ │  │
│  │                                                   │  │
│  │  🔒 Ihre Daten sind sicher und werden nicht        │  │
│  │     an Dritte weitergegeben.                      │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Layout-Regeln

```
Regel                            Umsetzung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vorname + Nachname               Nebeneinander (50/50)
                                 Auf Mobile: untereinander

PLZ + Ort                        Nebeneinander (30/70)
                                 Auf Mobile: untereinander

Alle anderen Felder              Volle Breite

Checkboxen (Newsletter, DSGVO)   Immer am Ende, vor dem Button

Button                           Volle Breite, prominent

Vertrauens-Hinweis               Unter dem Button, klein, grau

Pflicht-Markierung               * nach dem Label, rote Farbe

Optional-Hinweis                 "(optional)" nach dem Label, grau

Validierungsfehler               Inline unter dem Feld, rot,
                                 erscheint sofort bei Verlassen
```

### 6.3 React-Komponente

```tsx
// src/frontend/assets/shared/LeadForm.tsx

interface LeadFormConfig {
  fields: FieldConfig[];
  buttonText: string;
  privacyUrl: string;
  newsletterLabel?: string;
  consentLabel?: string;
  trustBadgeText?: string;
}

interface FieldConfig {
  slug: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox';
  label: string;
  placeholder?: string;
  hint?: string;
  status: 'required' | 'optional' | 'hidden';
  options?: { value: string; label: string }[];  // Für select
  order: number;
}

export function LeadForm({ config, onSubmit, isLoading }: {
  config: LeadFormConfig;
  onSubmit: (data: LeadData) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(buildSchema(config.fields)),
  });

  // Nur sichtbare Felder rendern, sortiert nach order
  const visibleFields = config.fields
    .filter(f => f.status !== 'hidden')
    .sort((a, b) => a.order - b.order);

  // Textfelder und Checkboxen trennen
  const inputFields = visibleFields.filter(f => f.type !== 'checkbox');
  const checkboxFields = visibleFields.filter(f => f.type === 'checkbox');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormHeader />

      {/* Eingabefelder */}
      <div className="ism-grid">
        {inputFields.map(field => (
          <FormField
            key={field.slug}
            field={field}
            register={register}
            error={errors[field.slug]}
          />
        ))}
      </div>

      {/* Checkboxen (Newsletter, DSGVO) */}
      <div className="ism-checkboxes">
        {checkboxFields.map(field => (
          <CheckboxField
            key={field.slug}
            field={field}
            register={register}
            error={errors[field.slug]}
            privacyUrl={field.slug === 'consent' ? config.privacyUrl : undefined}
          />
        ))}
      </div>

      {/* Submit */}
      <SubmitButton
        text={config.buttonText}
        isLoading={isLoading}
      />

      <TrustBadge text={config.trustBadgeText} />
    </form>
  );
}
```

### 6.4 Dynamische Zod-Schema-Generierung

```typescript
// src/frontend/lib/validation.ts

export function buildSchema(fields: FieldConfig[]): ZodObject<any> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    if (field.status === 'hidden') continue;

    let validator: ZodTypeAny;

    switch (field.type) {
      case 'email':
        validator = z.string().email(__('Please enter a valid email address', 'ism'));
        break;

      case 'tel':
        validator = z.string()
          .regex(/^[+\d\s\-()]{6,20}$/, __('Please enter a valid phone number', 'ism'));
        break;

      case 'checkbox':
        if (field.slug === 'consent') {
          // DSGVO: MUSS true sein
          validator = z.literal(true, {
            errorMap: () => ({ message: __('Please accept the privacy policy', 'ism') }),
          });
        } else {
          validator = z.boolean().default(false);
        }
        break;

      case 'textarea':
        validator = z.string().max(500);
        break;

      case 'select':
        const values = field.options?.map(o => o.value) ?? [];
        validator = z.enum(values as [string, ...string[]]);
        break;

      default:
        validator = z.string().min(2, __('Please fill in this field', 'ism'));
    }

    // Optional-Felder: leerer String erlaubt
    if (field.status === 'optional' && field.type !== 'checkbox') {
      validator = validator.or(z.literal(''));
    }

    shape[field.slug] = validator;
  }

  return z.object(shape);
}
```

---

## 7. Admin: Feld-Texte anpassen (Premium)

Premium-Nutzer können Labels, Platzhalter und Hilfstexte pro Feld ändern:

```
┌─────────────────────────────────────────────────────────────────┐
│  Feld: Telefon                                                  │
│                                                                 │
│  Status:       ○ Pflicht  ● Optional  ○ Aus                    │
│                                                                 │
│  Label:        [Telefonnummer                              ]    │
│  Placeholder:  [+49 123 456789                             ]    │
│  Hilfstext:    [Für eine persönliche Beratung              ]    │
│                                                                 │
│  [Auf Standard zurücksetzen]                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Feld: Newsletter                                               │
│                                                                 │
│  Status:       ○ Pflicht  ● Optional  ○ Aus                    │
│                                                                 │
│  Label:        [Ja, ich möchte regelmäßig Immobilien-      ]    │
│                [Marktberichte per E-Mail erhalten.          ]    │
│                                                                 │
│  [Auf Standard zurücksetzen]                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Feld: DSGVO-Einwilligung                                       │
│                                                                 │
│  Label:        [Ich stimme der Verarbeitung meiner Daten   ]    │
│                [gemäß der {datenschutz_link} zu.            ]    │
│                                                                 │
│  Datenschutz-  [https://meine-firma.de/datenschutz         ]    │
│  seite URL:                                                     │
│                                                                 │
│  Link-Text:    [Datenschutzerklärung                       ]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Texte sind übersetzbar (i18n)

Wenn der Makler Custom-Texte eingibt, gelten diese für die **aktuelle Sprache**. Für andere Sprachen gelten die ISM-Standard-Übersetzungen — es sei denn, der Makler übersetzt auch dort.

```
Sprache: [▼ Deutsch (DE)  ]  ← Sprach-Umschalter in der Konfiguration
```

---

## 8. CTA-Button: Text & Gestaltung

Der Button-Text ist **entscheidend** für die Conversion. ISM bietet Voreinstellungen und erlaubt Custom-Text:

```
Voreinstellungen:
━━━━━━━━━━━━━━━━
"Ergebnis anzeigen"              ← Standard (direkt, klar)
"Meine Analyse erhalten"         ← Persönlicher
"Kostenlose Analyse anfordern"   ← Betont den Wert
"Jetzt berechnen"                ← Aktionsorientiert

Oder eigener Text:  [                              ]
```

### Button-Design (nicht änderbar, ISM-optimiert)

```
┌───────────────────────────────────────────────┐
│           Ergebnis anzeigen →                  │
└───────────────────────────────────────────────┘
  ↑                                           ↑
  Primärfarbe des Maklers                     Pfeil = Vorwärtsbewegung
  Volle Breite                                
  Hover: leicht dunkler
  Klick: Loading-Spinner
  Disabled: ausgegraut (wenn Validierung fehlt)
```

---

## 9. Vertrauenselemente

Direkt unter dem Formular — reduzieren die Angst, Daten herzugeben:

```
Standard-Vertrauenshinweis:
━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Ihre Daten sind sicher und werden nicht an Dritte weitergegeben.

Konfigurierbar (Premium):
━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Schloss-Icon anzeigen                    [✓]
☐ Text anzeigen                            [✓]
  Text: [Ihre Daten sind sicher und werden nicht    ]
        [an Dritte weitergegeben.                   ]
☐ SSL-Badge anzeigen                       [ ]
☐ Bewertungs-Badge anzeigen (z.B. Google)  [ ]
  Badge-URL: [                                      ]
```

---

## 10. Spam-Schutz

Ohne Captcha — Captchas töten Conversion. Stattdessen unsichtbare Methoden:

```
Methode                     Umsetzung                          Wirksamkeit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Honeypot-Feld               Unsichtbares Feld "website"        ★★★★☆
                            Bot füllt es aus → Lead abgelehnt

Zeitprüfung                 Formular < 3 Sekunden              ★★★☆☆
                            ausgefüllt → verdächtig

WordPress Nonce             CSRF-Token im Formular             ★★★★★
                            Pflicht für REST-API-Calls

Rate-Limiting               Max 5 Leads/Minute pro IP          ★★★★☆
                            Max 20 Leads/Stunde pro IP

E-Mail-Validierung          Syntax + MX-Record prüfen          ★★★☆☆
                            (keine Wegwerf-Domains)

Optional: reCAPTCHA v3      Unsichtbar, Score-basiert           ★★★★★
                            (als Add-on oder Einstellung)
```

```
┌─────────────────────────────────────────────────────────────────┐
│  Einstellungen → Spam-Schutz                                    │
│                                                                 │
│  ✅ Honeypot-Feld (empfohlen, immer aktiv)                      │
│  ✅ Zeitprüfung (Minimum 3 Sekunden)                            │
│  ✅ Rate-Limiting (5/min, 20/h pro IP)                          │
│  ☐  Wegwerf-E-Mail-Domains blockieren                          │
│  ☐  Google reCAPTCHA v3                                         │
│      Site Key:   [                                ]             │
│      Secret Key: [                                ]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. DSGVO: Zwei getrennte Einwilligungen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  EINWILLIGUNG 1: Datenverarbeitung (Pflicht)                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    │
│                                                                 │
│  ☑ Ich stimme der Verarbeitung meiner Daten gemäß der           │
│    Datenschutzerklärung zu. *                                   │
│                                                                 │
│  Zweck:    Durchführung der Berechnung, Zustellung des          │
│            Ergebnisses per E-Mail (PDF), Kontaktaufnahme        │
│  Rechts-   Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)           │
│  grundlage: ODER Art. 6 Abs. 1 lit. b (vorvertragliche         │
│            Maßnahme — je nach Makler-Konfiguration)             │
│  Pflicht:  Ja, ohne diese geht nichts                           │
│  Widerruf: Jederzeit möglich (Hinweis in E-Mail-Footer)         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  EINWILLIGUNG 2: Newsletter (Optional, separat)                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                 │
│                                                                 │
│  ☐ Ja, ich möchte Marktberichte per E-Mail erhalten.            │
│                                                                 │
│  Zweck:    Zusendung von Newsletter / Marktberichten            │
│  Rechts-   Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)           │
│  grundlage: Kopplungsverbot beachten!                           │
│  Pflicht:  Nein, immer freiwillig                               │
│  Widerruf: Jederzeit per Abmelde-Link                           │
│  DOI:      Separater Double-Opt-In per E-Mail                   │
│                                                                 │
│  ⚠ Newsletter-Checkbox darf NICHT vorausgewählt sein            │
│  ⚠ Newsletter-Einwilligung darf NICHT Bedingung für             │
│    den Erhalt des Ergebnisses sein (Kopplungsverbot)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### DOI-Flow (Double-Opt-In)

```
Ergebnis-PDF:         Wird SOFORT gesendet (basiert auf Einwilligung 1)
                      Kein DOI nötig — ist kein Newsletter

Newsletter-DOI:       Wird NUR gesendet wenn Checkbox angehakt
                      Separate E-Mail: "Bitte bestätigen Sie Ihre Anmeldung"
                      Erst nach Klick auf Bestätigungs-Link:
                      → Lead bekommt Tag "newsletter-confirmed"
                      → Lead wird an Newsletter-System übergeben
```

---

## 12. Datenmodell

### Lead-Speicherung

```json
// Gespeicherter Lead in ism_leads
{
  "id": 4523,
  "first_name": "Maria",
  "last_name": "Schmidt",
  "email": "maria@example.com",
  "phone": "+49 123 456789",
  "salutation": "mrs",
  "company": null,
  "street": null,
  "zip": null,
  "city_input": null,
  "message": null,
  "callback_requested": false,
  "newsletter_optin": true,
  "newsletter_doi_confirmed": false,
  "newsletter_doi_sent_at": "2026-02-25T14:30:00Z",
  "consent": true,
  "consent_date": "2026-02-25T14:29:45Z",
  "asset_type": "mietpreis",
  "location_id": 7,
  "agent_id": 2,
  "status": "new",
  "inputs": { "area_sqm": 75, "condition": "normal", "has_balcony": true },
  "result": { "rent_min": 714, "rent_max": 833, "rent_median": 773 },
  "meta": {
    "page_url": "https://makler.de/mietpreisrechner",
    "referrer": "https://google.com",
    "utm_source": "google",
    "utm_medium": "cpc",
    "ip_hash": "a1b2c3...",
    "user_agent": "Mozilla/5.0...",
    "form_preset": "balanced",
    "form_fields_shown": ["first_name", "last_name", "email", "phone", "newsletter", "consent"]
  },
  "created_at": "2026-02-25T14:29:45Z"
}
```

**Wichtig:** `form_fields_shown` wird mitgespeichert — so weiß der Makler später, welche Felder der Lead gesehen hat (hilfreich wenn das Formular nachträglich geändert wird).

---

## 13. Free vs. Premium

```
Feature                              Free              Premium
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Formular-Presets                     ✅ Nur "Balanced"  ✅ Alle 4 Presets
Individuell konfigurieren            ❌                 ✅
Felder ein-/ausschalten              ❌                 ✅
Pflicht/Optional umschalten          ❌                 ✅
Feldreihenfolge ändern               ❌                 ✅
Labels/Placeholder anpassen          ❌                 ✅
Pro-Asset-Überschreibung             ❌                 ✅
Button-Text anpassen                 ❌                 ✅
Vertrauenselemente konfigurieren     ❌                 ✅
Newsletter-Checkbox                  ❌                 ✅
Rückruf-Checkbox                     ❌                 ✅
Adress-Felder                        ❌                 ✅
Firma-Feld                           ❌                 ✅
Anrede-Feld                          ❌                 ✅
Nachricht-Feld                       ❌                 ✅
reCAPTCHA v3                         ❌                 ✅
Honeypot + Zeitprüfung               ✅                 ✅
```

---

## 14. Zusammenfassung

```
┌──────────────────────────────────────────────────────────────┐
│  ISM Lead-Formular auf einen Blick                           │
│                                                              │
│  EIN Schritt:    Alle Felder auf einmal, kein Nachfordern    │
│  EIN Formular:   Global konfiguriert, pro Asset überschreibbar│
│                                                              │
│  3 Pflichtfelder (nicht abschaltbar):                        │
│    Vorname, E-Mail, DSGVO-Einwilligung                       │
│                                                              │
│  9 konfigurierbare Felder:                                   │
│    Nachname, Telefon, Anrede, Firma, Adresse (3),            │
│    Nachricht, Rückruf, Newsletter                            │
│    → Jeweils: Pflicht / Optional / Aus                       │
│                                                              │
│  4 Presets: Minimal, Balanced, Qualifiziert, Gewerbe         │
│  + Individuell                                               │
│                                                              │
│  DSGVO: Zwei getrennte Einwilligungen                        │
│    1. Datenverarbeitung (Pflicht, kein DOI)                  │
│    2. Newsletter (Optional, separater DOI)                   │
│                                                              │
│  Spam-Schutz: Honeypot + Zeit + Rate-Limit + Nonce          │
│    Optional: reCAPTCHA v3 (Premium)                          │
│                                                              │
│  Free: Balanced-Preset fest                                  │
│  Premium: Volle Konfiguration + Presets                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
