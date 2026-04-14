import SpotlightCard from './components/Components/SpotlightCard/SpotlightCard';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(101, 202, 228, 0.51)">
        Text Placeholrder
      </SpotlightCard>
    </div>
  );
}