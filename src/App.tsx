
import Home from './pages/Home'
import PerSquareMetreMap from './pages/PerSquareMetreMap'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import TestMapPage from './pages/TestMapPage'
import GreenBeltElectionMap from './pages/GreenBeltElectionMap'
// /src/pages/GBConstituencies/GBConstituencyTable.tsx
import { GBConstituencyTable } from './pages/GBConstituencies/GBConstituencyTable'
import { YAMLEssay } from './pages/Essay'
import GBStationsMap from './pages/GBStationsMap'

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
      path: '/gb-constituencies',
      element: <GBConstituencyTable />,
    },
    {
      path: '/essay',
      element: <YAMLEssay />,
    },
    {
      path: '/gb-stations',
      element: <GBStationsMap />,
    }
  ])

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  )
}

export default App
