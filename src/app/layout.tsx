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
        <footer style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--secondary-text)', fontSize: '14px', lineHeight: '1.6' }}>
          <p>Copyright © MLA Office Kunnamangalam</p>
          <p style={{ marginTop: '4px', fontSize: '0.9rem' }}>
            Developed by <a href="https://wa.me/917559865389?text=Hi%20Dot%20Projects%2C%20we%20experienced%20your%20registration%20website%20for%20MLA%20office%20Kunnamangalam%20events%2C%20we%20have%20an%20enquiry." target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Dot Projects</a>
          </p>
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
