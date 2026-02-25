/**
 * Settings page — agent data, branding, license, GDPR.
 */

export function Settings() {
	return (
		<div>
			<h1 className="resa-text-2xl resa-font-bold resa-mb-4">Einstellungen</h1>
			<p className="resa-text-muted-foreground">
				Maklerdaten, Branding, Lizenz und Datenschutz-Einstellungen.
			</p>

			<div className="resa-mt-6 resa-space-y-4">
				<SettingsSection title="Maklerdaten">
					Wird in einer späteren Phase implementiert.
				</SettingsSection>
				<SettingsSection title="Branding & Design">
					Wird in einer späteren Phase implementiert.
				</SettingsSection>
				<SettingsSection title="Lizenz">
					Version: {window.resaAdmin?.version ?? '—'}
				</SettingsSection>
				<SettingsSection title="Datenschutz (DSGVO)">
					Wird in einer späteren Phase implementiert.
				</SettingsSection>
			</div>
		</div>
	);
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="resa-rounded-lg resa-border resa-bg-card resa-p-5">
			<h2 className="resa-font-semibold resa-mb-2">{title}</h2>
			<p className="resa-text-sm resa-text-muted-foreground">{children}</p>
		</div>
	);
}
