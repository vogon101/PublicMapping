
import Home from './pages/Home'
import PerSquareMetreMap from './pages/PerSquareMetreMap'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import TestMapPage from './pages/TestMapPage'
import GreenBeltElectionMap from './pages/GreenBeltElectionMap'
import StationConstituencies from './pages/StationConstituencies/StationConstituencies'

function App() {
  
  
  const router = createBrowserRouter([
    {
      path: '/psqm',
      element: <PerSquareMetreMap />,
    },
    {
      path: '/',
      element: <Home />,
    }, {
      path: '/test',
      element: <TestMapPage />,
    },
    {
      path: '/green-belt-election',
      element: <GreenBeltElectionMap />,
    },
    {
      path: '/station-constituencies',
      element: <StationConstituencies />,
    }
  ])

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  )
}

export default App
