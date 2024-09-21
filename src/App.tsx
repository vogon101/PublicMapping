
import './App.css'
import Home from './Pages/Home'
import PerSquareMetreMap from './Pages/PerSquareMetreMap'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

function App() {
  
  
  const router = createBrowserRouter([
    {
      path: '/psqm',
      element: <PerSquareMetreMap />,
    },
    {
      path: '/',
      element: <Home />,
    },
  ])

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  )
}

export default App
