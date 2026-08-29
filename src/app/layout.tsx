import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MLA Teachers Day Registration',
  description: 'Registration for Teachers Day programme conducted by MLA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <footer style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--secondary-text)', fontSize: '14px' }}>
          <p>© 2026 MLA Teachers Day Programme.</p>
          <div style={{ marginTop: '20px' }}>
            <Link href="/admin" style={{ opacity: 0.5, textDecoration: 'none', color: 'inherit', fontSize: '12px' }}>
              Admin Login
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
