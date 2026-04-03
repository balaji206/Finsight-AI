import SharedNavbar from './SharedNavbar';
import AppFooter from './AppFooter';

export default function ProtectedLayout({ children }) {
  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SharedNavbar variant="app" />
      {/* paddingTop accounts for 72px logo + 0.75rem*2 padding = ~106px total */}
      <main style={{ flex: 1, paddingTop: '6.5rem' }}>
        {children}
      </main>
      <AppFooter variant="app" />
    </div>
  );
}
