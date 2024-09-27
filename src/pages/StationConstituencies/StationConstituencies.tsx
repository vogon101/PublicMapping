import { useState, useEffect } from 'react'
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { loadConstituencies, Constituency } from "./data"

export default function StationConstituencies() {
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadConstituencies()
        setConstituencies(data)
        console.log(data)
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to load constituencies:", err)
        setError("Failed to load data. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={constituencies} />
    </div>
  )
}
