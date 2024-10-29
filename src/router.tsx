import { createBrowserRouter } from 'react-router-dom';
import Reactions from './pages/Reactions';
import Home from './pages/Home';
// ... existing imports ...

export const router = createBrowserRouter([
  // ... other routes ...
  {
    path: '/reactions',
    element: <Reactions />
  },
  {
    path: '/',
    element: <Home />
  }
]);
