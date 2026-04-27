export function Footer() {
  return (
    <footer style={{
      textAlign: 'center', padding: '2rem 1.5rem 1.5rem',
      borderTop: '1px solid var(--border)', marginTop: '2rem',
    }}>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
        <FooterLink href="https://dinodinostudio.vercel.app/">Dinodino Studio</FooterLink>
        <span style={{ margin: '0 8px', color: 'var(--border2)' }}>×</span>
        <FooterLink href="https://dinodinolearn.vercel.app/">Dinodino Learn</FooterLink>
      </p>
      <p style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.04em' }}>
        Part of{' '}
        <a
          href="https://dinodino.vercel.app/"
          target="_blank" rel="noreferrer"
          style={{ color: 'var(--text3)', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.06em' }}
        >
          DINODINO UNIVERSE
        </a>
        {' '}· 2026
      </p>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href} target="_blank" rel="noreferrer"
      style={{
        fontFamily: 'var(--font-display)', color: 'var(--text2)',
        textDecoration: 'none', fontSize: 13,
      }}
    >
      {children}
    </a>
  )
}
