//Component inspired by Kevin Levron:
//https://x.com/soju22/status/1858925191671271801
  
import Ballpit from './Ballpit;'

<div style={{position: 'relative', overflow: 'hidden', height: '100vh', width: '100%'}}>
  <Ballpit
    count={100}
    gravity={0.01}
    friction={1}
    wallBounce={0.95}
    followCursor={false}
  />
</div>