import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/admin.css';

const container = document.getElementById('resa-admin-root');
if (container) {
	createRoot(container).render(<App />);
}
