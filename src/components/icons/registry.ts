/**
 * Icon Registry — Central mapping from semantic names to SVG content.
 *
 * All 40 custom immobilien-specific SVG icons are registered here.
 * Modules reference icons by semantic name only (e.g. 'haus'),
 * never by file path. SVGs use CSS variables (--resa-icon-*)
 * for theming.
 *
 * Categories:
 * - immobilientyp: Wohnung, Haus, Gewerbe, Grundstück
 * - haustypen: Einfamilienhaus, Mehrfamilienhaus, Bungalow, etc.
 * - ausstattung: Balkon, Garage, Garten, Kamin, etc.
 * - zustand: Neubau, Renoviert, Gut, Reparaturen
 * - qualitaetsstufen: Einfach, Normal, Gehoben, Luxuriös
 * - nutzung: Kaufen, Verkaufen, Vermietet, etc.
 * - modernisierung, zeitrahmen
 */

// --- Immobilientyp ---
import gewerbe from './svg/immobilientyp/gewerbe.svg?raw';
import grundstueck from './svg/immobilientyp/grundstueck.svg?raw';
import haus from './svg/immobilientyp/haus.svg?raw';
import wohnung from './svg/immobilientyp/wohnung.svg?raw';

// --- Haustypen ---
import bungalow from './svg/haustypen/bungalow.svg?raw';
import doppelhaushaelfte from './svg/haustypen/doppelhaushaelfte.svg?raw';
import einfamilienhaus from './svg/haustypen/einfamilienhaus.svg?raw';
import endreihenhaus from './svg/haustypen/endreihenhaus.svg?raw';
import mehrfamilienhaus from './svg/haustypen/mehrfamilienhaus.svg?raw';
import mittelreihenhaus from './svg/haustypen/mittelreihenhaus.svg?raw';
import zweifamilienhaus from './svg/haustypen/zweifamilienhaus.svg?raw';

// --- Wohnungstypen ---
import erdgeschoss from './svg/wohnungstypen/erdgeschoss.svg?raw';
import etagenwohnung from './svg/wohnungstypen/etagenwohnung.svg?raw';
import dachgeschoss from './svg/wohnungstypen/dachgeschoss.svg?raw';
import maisonette from './svg/wohnungstypen/maisonette.svg?raw';
import penthouse from './svg/wohnungstypen/penthouse.svg?raw';

// --- Ausstattung ---
import aufzug from './svg/ausstattung/aufzug.svg?raw';
import balkon from './svg/ausstattung/balkon.svg?raw';
import barrierefrei from './svg/ausstattung/barrierefrei.svg?raw';
import dachboden from './svg/ausstattung/dachboden.svg?raw';
import fussbodenheizung from './svg/ausstattung/fussbodenheizung.svg?raw';
import garage from './svg/ausstattung/garage.svg?raw';
import garten from './svg/ausstattung/garten.svg?raw';
import kamin from './svg/ausstattung/kamin.svg?raw';
import keller from './svg/ausstattung/keller.svg?raw';
import kueche from './svg/ausstattung/kueche.svg?raw';
import parkettboden from './svg/ausstattung/parkettboden.svg?raw';
import solaranlage from './svg/ausstattung/solaranlage.svg?raw';
import stellplatz from './svg/ausstattung/stellplatz.svg?raw';
import terrasse from './svg/ausstattung/terrasse.svg?raw';
import wc from './svg/ausstattung/wc.svg?raw';

// --- Zustand ---
import gut from './svg/zustand/gut.svg?raw';
import neubau from './svg/zustand/neubau.svg?raw';
import renoviert from './svg/zustand/renoviert.svg?raw';
import reparaturen from './svg/zustand/reparaturen.svg?raw';

// --- Qualitätsstufen ---
import einfach from './svg/qualitaetsstufen/einfach.svg?raw';
import gehoben from './svg/qualitaetsstufen/gehoben.svg?raw';
import luxurioes from './svg/qualitaetsstufen/luxurioes.svg?raw';
import normal from './svg/qualitaetsstufen/normal.svg?raw';

// --- Nutzung ---
import kaufen from './svg/nutzung/kaufen.svg?raw';
import leerstand from './svg/nutzung/leerstand.svg?raw';
import selbstgenutzt from './svg/nutzung/selbstgenutzt.svg?raw';
import verkaufen from './svg/nutzung/verkaufen.svg?raw';
import vermietet from './svg/nutzung/vermietet.svg?raw';

// --- Immobilientyp (zusätzlich) ---
import hausEuro from './svg/immobilientyp/haus-euro.svg?raw';

// --- Sonstige ---
import modernisierung from './svg/modernisierung/modernisierung.svg?raw';
import zeitrahmen from './svg/zeitrahmen/zeitrahmen.svg?raw';

/**
 * All registered icons keyed by semantic name.
 * Values are raw SVG strings.
 */
export const icons: Record<string, string> = {
	// Immobilientyp
	gewerbe,
	grundstueck,
	haus,
	wohnung,
	'haus-euro': hausEuro,

	// Haustypen
	bungalow,
	doppelhaushaelfte,
	einfamilienhaus,
	endreihenhaus,
	mehrfamilienhaus,
	mittelreihenhaus,
	zweifamilienhaus,

	// Wohnungstypen
	erdgeschoss,
	etagenwohnung,
	dachgeschoss,
	maisonette,
	penthouse,

	// Ausstattung
	aufzug,
	balkon,
	barrierefrei,
	dachboden,
	fussbodenheizung,
	garage,
	garten,
	kamin,
	keller,
	kueche,
	parkettboden,
	solaranlage,
	stellplatz,
	terrasse,
	wc,

	// Zustand
	gut,
	neubau,
	renoviert,
	reparaturen,

	// Qualitätsstufen
	einfach,
	gehoben,
	luxurioes,
	normal,

	// Nutzung
	kaufen,
	leerstand,
	selbstgenutzt,
	verkaufen,
	vermietet,

	// Sonstige
	modernisierung,
	zeitrahmen,

	// Aliase
	solar: solaranlage,
	reihenhaus: mittelreihenhaus,
	premium: gehoben,
	standard: normal,
};

/**
 * Get raw SVG string by name. Returns undefined if not found.
 */
export function getIcon(name: string): string | undefined {
	return icons[name];
}

/**
 * Get all registered icon names.
 */
export function getIconNames(): string[] {
	return Object.keys(icons);
}
