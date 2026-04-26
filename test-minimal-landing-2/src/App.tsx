import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/Home';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'relative', minHeight: '100vh' }}>

        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
