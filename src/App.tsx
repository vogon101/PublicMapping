
import './App.css'
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
      element: <div>
        <h1>Home</h1>
      </div>,
    },
  ])

  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  )
}

export default App
