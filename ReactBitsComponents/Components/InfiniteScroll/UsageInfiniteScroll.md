import InfiniteScroll from './InfiniteScroll'

const items = [
  { content: 'Placeholder 1' },
  { content: 'Placeholder 2' },
  { content: 'Placeholder 3' },
  { content: 'Placeholder 4' },
  { content: 'Placeholder 5' },
  { content: 'Placeholder 6' },
  { content: 'Placeholder 7' },
  { content: 'Placeholder 8' },
];

<InfiniteScroll
  items={items}
  isTilted={false}
  tiltDirection='left'
  autoplay={true}
  autoplaySpeed={1.2}
  autoplayDirection="down"
  pauseOnHover={true}
/>
