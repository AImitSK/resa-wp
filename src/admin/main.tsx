import { createRoot } from 'react-dom/client';
import './styles/admin.css';

function App() {
	return (
		<div className="resa-admin">
			<h1>RESA Dashboard</h1>
			<p>Admin Entry Point funktioniert.</p>
		</div>
	);
}

const container = document.getElementById( 'resa-admin-root' );
if ( container ) {
	createRoot( container ).render( <App /> );
}
