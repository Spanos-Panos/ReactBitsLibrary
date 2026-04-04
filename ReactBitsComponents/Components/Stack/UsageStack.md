import Stack from './Stack'

const images = [
  { id: 1, img: "/joker-portrait.jpg" },
  { id: 2, img: "/joker-portrait.jpg" },
  { id: 3, img: "/joker-portrait.jpg" },
  { id: 4, img: "/joker-portrait.jpg" }
];
  
<Stack
  randomRotation={true}
  sensitivity={180}
  sendToBackOnClick={false}
  cardDimensions={{ width: 200, height: 200 }}
  cardsData={images}
/>