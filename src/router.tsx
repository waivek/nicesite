import { createBrowserRouter } from 'react-router-dom';
import Reactions from './pages/Reactions';
import Home from './pages/Home';
import Dailies from './pages/Dailies';

export const router = createBrowserRouter([
  // ... other routes ...
  {
    path: '/reactions',
    element: <Reactions />
  },
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/dailies',
    element: <Dailies />
  }
]);
