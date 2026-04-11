import Folder from './Folder';
import { RiImageFill, RiFileTextFill, RiMusicFill } from "react-icons/ri";

export default function App() {
  const folderItems = [
    <RiImageFill size={40} color="#ff4757" />,
    <RiFileTextFill size={40} color="#341f97" />,
    <RiMusicFill size={40} color="#f9ca24" />
  ];

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      // NEW: Deep Slate for better contrast
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
       <Folder 
         size={2.8} 
         color="#5227FF" 
         items={folderItems} 
       />
    </div>
  );
}