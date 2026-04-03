import SharedNavbar from './SharedNavbar';
import AppFooter from './AppFooter';
import './AppLayout.css';

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <SharedNavbar variant="app" />
      <main className="app-layout-main">
        {children}
      </main>
      <AppFooter variant="app" />
    </div>
  );
}
