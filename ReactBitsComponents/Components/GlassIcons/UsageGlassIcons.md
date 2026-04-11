import GlassIcons from './GlassIcons';
import { FiFileText, FiBook, FiHeart, FiCloud, FiEdit, FiBarChart2 } from 'react-icons/fi';

export default function App() {
  const items = [
    { icon: <FiFileText />, color: 'blue', label: 'Files' },
    { icon: <FiBook />, color: 'purple', label: 'Books' },
    { icon: <FiHeart />, color: 'red', label: 'Health' },
    { icon: <FiCloud />, color: 'indigo', label: 'Weather' },
    { icon: <FiEdit />, color: 'orange', label: 'Notes' },
    { icon: <FiBarChart2 />, color: 'green', label: 'Stats' },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassIcons items={items} />
    </div>
  );
}
