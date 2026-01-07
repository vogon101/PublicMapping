import { ColumnDef, Row, Column } from "@tanstack/react-table"
import { Constituency } from "./data"
import { partyColors, partyShortNames, partyTextColors, partyNames } from "@/data/parties"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, Filter } from "lucide-react"

// Add this import for the party colors

const ratioCell = (accessorKey: "ratio800" | "ratio1000" | "ratio1200" | "ratio1500") => ({ row }: { row: Row<Constituency> }) => {
  const ratio = row.original[accessorKey]
  const percentage = ratio * 100;

  return (
    <div className="group w-full bg-gray-200 rounded-lg h-8 dark:bg-gray-700 hover:bg-gray-300">
      <div className="bg-green-600 h-full rounded-lg flex items-center px-1" style={{ width: `${percentage}%` }}>
        <span className={`text-xs py-1 px-2 bg-white rounded-lg opacity-50 group-hover:opacity-100`} >
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

interface HeaderOptions {
  enableSorting?: boolean;
  enableFiltering?: boolean;
  filterOptions?: string[];
}

const headerCell = (label: string, options: HeaderOptions = {}) => ({ column }: { column: Column<any, unknown> }) => {
  const { enableSorting = false, enableFiltering = false, filterOptions = [] } = options;

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        onClick={() => enableSorting && column.toggleSorting(column.getIsSorted() === "asc")}
        disabled={!enableSorting}
      >
        {label}
        {enableSorting && <ArrowUpDown className="ml-2 h-4 w-4" />}
      </Button>
      {enableFiltering && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 ml-2 align-left">
              <Filter className={`h-4 w-4`} style={{ color: column.getFilterValue() ? partyColors[column.getFilterValue() as keyof typeof partyColors] : "#555" }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => column.setFilterValue(undefined)}>
              All
            </DropdownMenuItem>
            {filterOptions.map((option) => (
              <DropdownMenuItem key={option} onClick={() => column.setFilterValue(option)}>
                <div className="rounded-full px-2 py-1" style={{ backgroundColor: partyColors[option as keyof typeof partyColors] || "#CCCCCC", color: partyTextColors[option as keyof typeof partyTextColors] || "#FFFFFF" }}>
                  {partyNames[option as keyof typeof partyNames]}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export const columns: ColumnDef<Constituency>[] = [
  {
    accessorKey: "PCON24NM",
    header: headerCell("Constituency", { enableSorting: true }),
    size: 200,
    meta: { minWidth: 150 },
  },
  {
    accessorKey: "winningParty",
    header: headerCell("Party", { 
      enableSorting: true, 
      enableFiltering: true, 
      filterOptions: Object.values(partyShortNames)
    }),
    cell: ({ row }) => {
      const party = row.original.winningParty
      const color = partyColors[party] || "#CCCCCC"
      const textColor = partyTextColors[party] || "#FFFFFF"
      return (
        <div className="flex items-center rounded-full px-2 py-1" style={{ backgroundColor: color, color: textColor }}>
          <span>{partyNames[party]}</span>
        </div>
      )
    },
    filterFn: (row, id, filterValue) => {
      return row.getValue(id) === filterValue
    },
    sortingFn: (rowA, rowB, columnId) => {
      const partyA = partyNames[rowA.getValue(columnId) as keyof typeof partyNames]
      const partyB = partyNames[rowB.getValue(columnId) as keyof typeof partyNames]
      return partyA.localeCompare(partyB)
    },
    size: 150,
    meta: { minWidth: 100 },
  },
  {
    accessorKey: "mpFullName",
    header: headerCell("MP", { enableSorting: true }),
    size: 120,
    meta: { minWidth: 100 },
  },
  {
    accessorKey: "ratio800",
    header: headerCell("% within 800m", { enableSorting: true }),
    size: 150,
    meta: { minWidth: 120 },
    cell: ratioCell("ratio800")
  },  
  {
    accessorKey: "ratio1500",
    header: headerCell("% within 1500m", { enableSorting: true }),
    size: 150,
    meta: { minWidth: 120 },
    cell: ratioCell("ratio1500")
  },
]