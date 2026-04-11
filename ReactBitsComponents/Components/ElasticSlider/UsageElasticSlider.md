import ElasticSlider from './ElasticSlider';

export default function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#0a0a0a', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <ElasticSlider
        startingValue={0}
        defaultValue={50}
        maxValue={100}
        isStepped={true}
        stepSize={5}
      />
    </div>
  );
}