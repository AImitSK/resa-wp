/**
 * Overview tab — Module info and status display.
 */

import { __ } from '@wordpress/i18n';
import type { ModuleInfo } from '../../hooks/useModuleSettings';

interface OverviewTabProps {
	module: ModuleInfo;
}

export function OverviewTab({ module }: OverviewTabProps) {
	// Inline styles for WordPress admin compatibility
	const tableRowStyle: React.CSSProperties = {
		display: 'grid',
		gridTemplateColumns: 'repeat(3, 1fr)',
		backgroundColor: 'white',
		borderRadius: '8px',
		border: '1px solid hsl(214.3 31.8% 91.4%)',
	};

	const cellStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '14px 20px',
	};

	const cellWithBorderStyle: React.CSSProperties = {
		...cellStyle,
		borderRight: '1px solid hsl(214.3 31.8% 91.4%)',
	};

	const labelStyle: React.CSSProperties = {
		fontSize: '14px',
		fontWeight: 500,
		color: '#1e303a',
	};

	const darkBadgeStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		padding: '3px 10px 5px 10px',
		borderRadius: '4px',
		fontSize: '11px',
		fontWeight: 500,
		backgroundColor: '#1e303a',
		color: '#ffffff',
	};

	const greenBadgeStyle: React.CSSProperties = {
		...darkBadgeStyle,
		backgroundColor: '#a9e43f',
		color: '#1e303a',
	};

	// Extended descriptions for each module
	const moduleDescriptions: Record<string, string> = {
		'rent-calculator': __(
			'Der Mietpreis-Kalkulator ermöglicht Immobilieninteressenten eine schnelle und präzise Einschätzung der ortsüblichen Miete für ihre Wunschimmobilie. Basierend auf Faktoren wie Lage, Wohnfläche, Ausstattung und Baujahr wird ein realistischer Mietpreis berechnet. Das Tool generiert qualifizierte Leads, indem Nutzer ihre Kontaktdaten hinterlassen, um eine detaillierte PDF-Auswertung zu erhalten. Ideal für Vermieter, die den Marktwert ihrer Immobilie ermitteln möchten, und für Makler zur Lead-Generierung.',
			'resa',
		),
		'value-calculator': __(
			'Der Immobilienwert-Kalkulator bietet eine fundierte Ersteinschätzung des Verkehrswerts einer Immobilie. Durch die Eingabe von Objektdaten wie Immobilientyp, Wohnfläche, Grundstücksgröße, Baujahr und Zustand wird ein marktgerechter Wertbereich ermittelt. Das Tool nutzt regionale Marktdaten und Vergleichswerte für eine realistische Bewertung. Perfekt für Eigentümer, die über einen Verkauf nachdenken, und für Makler zur Akquise von Verkaufsobjekten.',
			'resa',
		),
		'purchase-costs': __(
			'Der Kaufnebenkosten-Rechner zeigt Immobilienkäufern transparent alle anfallenden Nebenkosten beim Immobilienerwerb. Grunderwerbsteuer, Notarkosten, Grundbuchgebühren und Maklerprovision werden standortspezifisch berechnet. Nutzer erhalten einen vollständigen Überblick über die Gesamtinvestition und können ihr Budget entsprechend planen. Ein unverzichtbares Tool für die Kaufberatung.',
			'resa',
		),
		'budget-calculator': __(
			'Der Budgetrechner hilft Kaufinteressenten, ihr maximales Immobilienbudget zu ermitteln. Basierend auf Einkommen, Eigenkapital, bestehenden Verbindlichkeiten und gewünschter Laufzeit wird die mögliche Finanzierungssumme berechnet. Das Tool berücksichtigt aktuelle Zinssätze und Tilgungsraten für eine realistische Einschätzung der finanziellen Möglichkeiten.',
			'resa',
		),
		'roi-calculator': __(
			'Der Renditerechner ermöglicht Kapitalanlegern die Berechnung der erwarteten Rendite einer Immobilieninvestition. Kaufpreis, Mieteinnahmen, Nebenkosten und Finanzierungskonditionen fließen in die Kalkulation ein. Das Tool zeigt Brutto- und Nettorendite sowie den Cashflow und hilft bei der Bewertung von Investitionsentscheidungen.',
			'resa',
		),
		'energy-check': __(
			'Der Energieeffizienz-Check analysiert den energetischen Zustand einer Immobilie und zeigt Optimierungspotenziale auf. Nutzer erhalten eine Einschätzung der Energieeffizienzklasse sowie Empfehlungen für Sanierungsmaßnahmen. Das Tool sensibilisiert für das Thema Energieeffizienz und generiert Leads für Energieberater und Modernisierungsexperten.',
			'resa',
		),
		'seller-checklist': __(
			'Die Verkäufer-Checkliste begleitet Immobilienverkäufer durch den gesamten Verkaufsprozess. Von der Unterlagenbeschaffung über die Preisfindung bis zum Notartermin werden alle wichtigen Schritte systematisch erfasst. Nutzer können ihren Fortschritt verfolgen und erhalten hilfreiche Tipps zu jedem Punkt. Ideal zur Lead-Qualifizierung und Verkäuferbetreuung.',
			'resa',
		),
		'buyer-checklist': __(
			'Die Käufer-Checkliste unterstützt Immobilienkäufer bei der systematischen Prüfung einer Kaufimmobilie. Alle wichtigen Aspekte von der Besichtigung über die Finanzierung bis zur Schlüsselübergabe werden abgedeckt. Das interaktive Tool hilft, keine wichtigen Punkte zu übersehen und dokumentiert den Kaufprozess strukturiert.',
			'resa',
		),
	};

	const getModuleDescription = () => {
		return moduleDescriptions[module.slug] || module.description;
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			{/* Quick stats as table row */}
			<div style={tableRowStyle}>
				{/* Kategorie */}
				<div style={cellWithBorderStyle}>
					<span style={labelStyle}>{__('Kategorie', 'resa')}</span>
					<span style={darkBadgeStyle}>
						{module.category === 'calculator'
							? __('Kalkulator', 'resa')
							: module.category}
					</span>
				</div>

				{/* Status */}
				<div style={cellWithBorderStyle}>
					<span style={labelStyle}>{__('Status', 'resa')}</span>
					<span style={module.active ? greenBadgeStyle : darkBadgeStyle}>
						{module.active ? __('Aktiv', 'resa') : __('Inaktiv', 'resa')}
					</span>
				</div>

				{/* Plan */}
				<div style={cellStyle}>
					<span style={labelStyle}>{__('Plan', 'resa')}</span>
					<span style={darkBadgeStyle}>
						{module.flag === 'free'
							? __('free', 'resa')
							: module.flag === 'pro'
								? __('Premium', 'resa')
								: __('Add-on', 'resa')}
					</span>
				</div>
			</div>

			{/* Shortcode info */}
			<div
				style={{
					backgroundColor: 'white',
					borderRadius: '8px',
					border: '1px solid hsl(214.3 31.8% 91.4%)',
					padding: '20px',
				}}
			>
				<h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1e303a', margin: 0 }}>
					{__('Shortcode', 'resa')}
				</h3>
				<p
					style={{
						fontSize: '13px',
						color: 'hsl(215.4 16.3% 46.9%)',
						marginTop: '8px',
						marginBottom: '12px',
					}}
				>
					{__(
						'Füge diesen Shortcode auf einer Seite ein, um das Modul anzuzeigen:',
						'resa',
					)}
				</p>
				<code
					style={{
						display: 'inline-block',
						backgroundColor: '#1e303a',
						color: '#a9e43f',
						padding: '8px 16px',
						borderRadius: '6px',
						fontSize: '13px',
						fontFamily: 'ui-monospace, monospace',
					}}
				>
					{`[resa module="${module.slug}"]`}
				</code>
			</div>

			{/* Description (2/3) + Documentation (1/3) side by side */}
			<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
				{/* Module description */}
				<div
					style={{
						backgroundColor: 'white',
						borderRadius: '8px',
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						padding: '20px',
					}}
				>
					<h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1e303a', margin: 0 }}>
						{__('Über dieses Modul', 'resa')}
					</h3>
					<p
						style={{
							fontSize: '14px',
							color: '#1e303a',
							lineHeight: 1.7,
							marginTop: '12px',
							marginBottom: 0,
						}}
					>
						{getModuleDescription()}
					</p>
				</div>

				{/* Documentation link */}
				<div
					style={{
						backgroundColor: 'white',
						borderRadius: '8px',
						border: '1px solid hsl(214.3 31.8% 91.4%)',
						padding: '20px',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					<h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1e303a', margin: 0 }}>
						{__('Dokumentation', 'resa')}
					</h3>
					<p
						style={{
							fontSize: '13px',
							color: 'hsl(215.4 16.3% 46.9%)',
							lineHeight: 1.6,
							marginTop: '12px',
							marginBottom: '16px',
							flex: 1,
						}}
					>
						{__(
							'Ausführliche Anleitungen zur Konfiguration und Best Practices für die Lead-Generierung.',
							'resa',
						)}
					</p>
					<a
						href="https://www.resa-wp.com/docs"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
							color: '#1e303a',
							fontWeight: 500,
							fontSize: '13px',
							textDecoration: 'none',
						}}
					>
						{__('Zur Dokumentation', 'resa')} →
					</a>
				</div>
			</div>
		</div>
	);
}
