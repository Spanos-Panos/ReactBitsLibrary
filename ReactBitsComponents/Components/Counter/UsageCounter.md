import { useState } from 'react';
import Counter from './Counter';

export default function App() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  const btnStyle = {
    padding: '10px 22px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    background: '#1e1e1e',
    color: '#fff',
    transition: 'background 0.15s',
  };

  const stepBtn = (s: number) => ({
    ...btnStyle,
    background: step === s ? '#fff' : '#1e1e1e',
    color: step === s ? '#000' : '#fff',
    padding: '6px 14px',
    fontSize: '0.85rem',
  });

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '40px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Counter
        value={count}
        places={[1000, 100, 10, 1]}
        fontSize={80}
        padding={5}
        gap={10}
        textColor="white"
        fontWeight={900}
        gradientFrom="black"
      />

      {/* Step selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#555', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step</span>
        {[1, 10, 100].map((s) => (
          <button key={s} style={stepBtn(s)} onClick={() => setStep(s)}>{s}</button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={btnStyle} onClick={() => setCount((c) => c - step)}>− {step}</button>
        <button
          style={{ ...btnStyle, background: '#222', color: '#666', padding: '10px 18px', fontSize: '0.85rem' }}
          onClick={() => setCount(0)}
        >
          Reset
        </button>
        <button style={btnStyle} onClick={() => setCount((c) => c + step)}>+ {step}</button>
      </div>
    </div>
  );
}
