

export default function HomePage() {
  return (
    <>
      <section style={{ padding: '8rem 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 4rem)', width: '100%' }}>
          <div style={{ textAlign: 'left', maxWidth: '680px' }}>
            <h1 style={{ fontSize: 'clamp(3rem,8vw,6rem)', fontWeight: '300', lineHeight: '1.0', color: 'var(--color-text)', margin: '0 0 1.5rem' }}>
              We test things
            </h1>
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--color-text)', opacity: 0.7, lineHeight: 1.7, maxWidth: '560px', margin: '0 0 2rem' }}>
              TestBrand — where craft meets purpose.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              <button style={{ padding: '0.85em 2.2em', background: 'var(--color-accent)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>Click Me</button>
              <button style={{ padding: '0.85em 2.2em', background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-text)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>Learn More</button>
            </div>
          </div>
        </div>
      </section>
      <section style={{ padding: '8rem 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 4rem)', width: '100%' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '3rem' }}>What We Do</h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            <div key="0" style={{ flex: '1 1 240px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-accent)' }}>◈</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem' }}>Strategy</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', opacity: 0.65, lineHeight: 1.65, margin: 0 }}>TestBrand delivers strategy  with measurable results.</p>
            </div>
            <div key="1" style={{ flex: '1 1 240px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-accent)' }}>◉</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem' }}>Execution</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', opacity: 0.65, lineHeight: 1.65, margin: 0 }}>Expert execution solutions designed to move the needle and exceed expectations.</p>
            </div>
            <div key="2" style={{ flex: '1 1 240px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-accent)' }}>◎</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem' }}>Growth</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', opacity: 0.65, lineHeight: 1.65, margin: 0 }}>Growth that scales with your ambitions and delivers consistent, reliable outcomes.</p>
            </div>
          </div>
        </div>
      </section>
      <section style={{ padding: '8rem 0', position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 4rem)', width: '100%' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '2.5rem' }}>Why Choose Us</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            
            <li key="0" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--color-text)' }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '1rem', opacity: 0.85 }}>Results-driven approach</span>
            </li>
            <li key="1" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--color-text)' }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '1rem', opacity: 0.85 }}>Expert team with proven track record</span>
            </li>
            <li key="2" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--color-text)' }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '1rem', opacity: 0.85 }}>Scalable solutions built to last</span>
            </li>
            <li key="3" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--color-text)' }}>
              <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '1rem', opacity: 0.85 }}>Dedicated support at every step</span>
            </li>
          </ul>
        </div>
      </section>
      <section style={{ padding: '8rem 0', position: 'relative', zIndex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 4rem)', width: '100%' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>Ready to work with TestBrand?</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text)', opacity: 0.65, maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.65 }}>Let's build something remarkable together.</p>
          <button style={{ padding: '1em 3em', background: 'var(--color-accent)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>Click Me</button>
        </div>
      </section>
      <footer style={{ padding: '4rem 0 2rem', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 4vw, 4rem)', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>TestBrand</div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <a key="Strategy" href="#strategy" style={{ color: 'var(--color-text)', opacity: 0.55, textDecoration: 'none', fontSize: '0.85rem' }}>Strategy</a>
          <a key="Execution" href="#execution" style={{ color: 'var(--color-text)', opacity: 0.55, textDecoration: 'none', fontSize: '0.85rem' }}>Execution</a>
          <a key="Growth" href="#growth" style={{ color: 'var(--color-text)', opacity: 0.55, textDecoration: 'none', fontSize: '0.85rem' }}>Growth</a>
              </div>
            </div>
            
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text)', opacity: 0.35, margin: 0 }}>© 2026 TestBrand. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
