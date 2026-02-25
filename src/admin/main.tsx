import { createRoot } from 'react-dom/client';
import { cn } from '@/lib/utils';
import './styles/admin.css';

function App() {
	return (
		<div className={cn('resa-max-w-5xl', 'resa-py-4')}>
			<h1 className="resa-text-2xl resa-font-bold resa-text-foreground">RESA Dashboard</h1>
			<p className="resa-mt-2 resa-text-muted-foreground">
				Admin Entry Point funktioniert. Tailwind mit resa- Prefix aktiv.
			</p>
		</div>
	);
}

const container = document.getElementById('resa-admin-root');
if (container) {
	createRoot(container).render(<App />);
}
