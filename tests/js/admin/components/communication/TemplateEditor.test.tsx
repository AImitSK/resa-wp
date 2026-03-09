import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TemplateEditor } from '@admin/components/communication/TemplateEditor';

// ─── Mock Data ──────────────────────────────────────────

const mockTemplate = {
	id: 'lead_notification',
	name: 'Lead-Benachrichtigung',
	subject: 'Neue Lead-Anfrage: {{lead_name}}',
	body: '<p>Hallo, ein neuer Lead ist eingegangen.</p>',
	is_active: true,
	has_attachment: true,
	variables: ['lead_name', 'lead_email', 'agent_name'],
};

const mockSave = vi.fn();
const mockReset = vi.fn();
const mockSendTest = vi.fn();

// ─── Mocks ──────────────────────────────────────────────

vi.mock('@admin/hooks/useEmailTemplates', () => ({
	useEmailTemplate: vi.fn(() => ({
		data: mockTemplate,
		isLoading: false,
		error: null,
	})),
	useSaveEmailTemplate: vi.fn(() => ({
		mutateAsync: mockSave,
		isPending: false,
	})),
	useResetEmailTemplate: vi.fn(() => ({
		mutateAsync: mockReset,
		isPending: false,
	})),
	useSendTestEmail: vi.fn(() => ({
		mutateAsync: mockSendTest,
		isPending: false,
	})),
}));

vi.mock('@admin/components/communication/tiptap/EmailEditor', () => ({
	EmailEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
		<textarea
			data-testid="email-editor"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	),
}));

vi.mock('@admin/components/communication/TemplatePreview', () => ({
	TemplatePreview: ({ subject, body: _body }: { subject: string; body: string }) => (
		<div data-testid="template-preview">
			<div>Preview: {subject}</div>
		</div>
	),
}));

vi.mock('@admin/lib/toast', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Helpers ────────────────────────────────────────────

function renderEditor() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<TemplateEditor templateId="lead_notification" onBack={vi.fn()} />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
	vi.clearAllMocks();
	window.resaAdmin = {
		restUrl: '/wp-json/resa/v1/',
		nonce: 'test-nonce',
		page: 'resa-settings',
		adminUrl: '/wp-admin/admin.php',
		pluginUrl: '/wp-content/plugins/resa/',
		version: '1.0.0',
		features: {
			plan: 'premium',
			is_trial: false,
			max_modules: null,
			max_locations: null,
			max_leads: 999,
			can_export_leads: true,
			can_use_pdf_designer: true,
			can_use_smtp: true,
			can_remove_branding: true,
			can_use_webhooks: true,
			can_use_api_keys: true,
			can_use_messenger: true,
			can_use_advanced_tracking: true,
		},
		locationCount: 1,
		siteName: 'Test Site',
		adminEmail: 'admin@test.de',
		integrationTabs: [],
	};
});

// ─── Tests ──────────────────────────────────────────────

describe('TemplateEditor', () => {
	it('rendert Editor und Preview', () => {
		renderEditor();
		expect(screen.getByTestId('email-editor')).toBeInTheDocument();
		expect(screen.getByTestId('template-preview')).toBeInTheDocument();
	});

	it('zeigt Betreff-Feld mit vorausgefülltem Wert', () => {
		renderEditor();
		expect(screen.getByDisplayValue('Neue Lead-Anfrage: {{lead_name}}')).toBeInTheDocument();
	});

	it('zeigt Aktiv-Toggle', () => {
		renderEditor();
		const switches = screen.getAllByRole('switch');
		expect(switches.length).toBeGreaterThanOrEqual(1);
	});

	it('zeigt Footer-Buttons', () => {
		renderEditor();
		expect(screen.getByText('Speichern')).toBeInTheDocument();
		expect(screen.getByText(/Test-Mail senden/)).toBeInTheDocument();
		expect(screen.getByText(/Auf Standard zurücksetzen/)).toBeInTheDocument();
	});

	it('zeigt Anhang-Hinweis bei has_attachment', () => {
		renderEditor();
		expect(screen.getByText(/automatisch als Anhang/)).toBeInTheDocument();
	});

	it('zeigt Lade-Zustand', async () => {
		const { useEmailTemplate } = await import('@admin/hooks/useEmailTemplates');
		vi.mocked(useEmailTemplate).mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
		} as ReturnType<typeof useEmailTemplate>);

		const { container } = renderEditor();
		// Loading state renders only a Spinner, no editor or preview
		expect(screen.queryByTestId('email-editor')).not.toBeInTheDocument();
		expect(container.querySelector('svg')).toBeInTheDocument();
	});
});
