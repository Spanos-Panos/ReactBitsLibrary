//Component inspired by Kevin Levron:
//https://x.com/soju22/status/1858925191671271801
  
import Ballpit from './Ballpit'

<div style={{position: 'relative', overflow: 'hidden', width: '100%', height: '100vh'}}>
  <Ballpit
    count={80}
    gravity={0.8}
    friction={0.95}
    wallBounce={0.7}
    followCursor={false}
  />
</div>