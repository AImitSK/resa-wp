import { createRoot } from 'react-dom/client';
import { cn } from '@/lib/utils';
import './styles/frontend.css';

function App() {
	return (
		<div className={ cn( 'resa-rounded-lg', 'resa-border', 'resa-bg-background', 'resa-p-6' ) }>
			<h2 className="resa-text-xl resa-font-semibold resa-text-foreground">
				RESA Widget
			</h2>
			<p className="resa-mt-2 resa-text-muted-foreground">
				Frontend Entry Point funktioniert. Tailwind mit resa- Prefix aktiv.
			</p>
		</div>
	);
}

// Mount in alle [resa] Shortcode-Container auf der Seite.
document.querySelectorAll< HTMLElement >( '.resa-widget-root' ).forEach( ( container ) => {
	createRoot( container ).render( <App /> );
} );
