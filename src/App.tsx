
import Home from './pages/Home'
import PerSquareMetreMap from './pages/PerSquareMetreMap'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import TestMapPage from './pages/TestMapPage'
import GreenBeltElectionMap from './pages/GreenBeltElectionMap'
import StationConstituenciesPage from './pages/StationConstituencies/StationConstituencies'
import Essay, { YAMLEssay } from './pages/Essay'

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
      element: <StationConstituenciesPage />,
    },
    {
      path: '/essay',
      element: <YAMLEssay />,
    }
  ])

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  )
}

export default App
