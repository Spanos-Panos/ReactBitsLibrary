import Cubes from './Cubes'

const Component = () => {
  return (
    <div style={{ height: '600px', position: 'relative' }}>
      <Cubes 
        gridSize={8}
        maxAngle={45}
        radius={3}
        borderStyle="2px dashed #B19EEF"
        faceColor="#1a1a2e"
        rippleColor="#ff6b6b"
        rippleSpeed={1.5}
        autoAnimate
        rippleOnClick
      />
    </div>
  );
};

export default Component;