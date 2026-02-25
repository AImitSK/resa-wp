import { createRoot } from 'react-dom/client';
import './styles/frontend.css';

function App() {
	return (
		<div style={ { padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px' } }>
			<h2>RESA Widget</h2>
			<p>Frontend Entry Point funktioniert.</p>
		</div>
	);
}

// Mount in alle [resa] Shortcode-Container auf der Seite.
document.querySelectorAll< HTMLElement >( '.resa-widget-root' ).forEach( ( container ) => {
	createRoot( container ).render( <App /> );
} );
