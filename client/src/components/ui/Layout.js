import Header from '../pages/Header/Header';

const Layout = ({ children, wide = false }) => (
    <div className="app-shell">
        <Header />
        <main className={`page ${wide ? 'page--wide' : ''}`}>{children}</main>
        <footer className="site-footer">
            <span>&copy; {new Date().getFullYear()} Poker Express</span>
            <span className="muted">Play money only · Built with React, Express &amp; WebSockets</span>
        </footer>
    </div>
);

export default Layout;
