import { useRef } from 'react';
import Crosshair from './Crosshair';

const Component = () => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} style={{ height: '300px', overflow: 'hidden' }}>
      <Crosshair containerRef={containerRef} color='#ffffff' />
    </div>
  )
};

export default Component;