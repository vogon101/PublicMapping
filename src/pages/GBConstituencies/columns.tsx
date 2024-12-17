import { ColumnDef, Row, Column } from "@tanstack/react-table"
import { Constituency } from "./data"
import { partyColors, partyShortNames, partyTextColors, partyNames } from "@/data/parties"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

// Add this import for the party colors

const ratioCell = (accessorKey: "gb_area" | "gb_pct" | "majority_pct") => ({ row }: { row: Row<Constituency> }) => {
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


function partyFilter(filterOptions: string[]) {
  return ( column: Column<Constituency, unknown> ) => {
    return (
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
    )
  }
}

function pctFilter() {
  return (column: Column<Constituency, unknown>) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 ml-2 align-left">
            <Filter className={`h-4 w-4`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span>Min</span>
              <span>Max</span>
            </div>
            <Slider
              value={column.getFilterValue() as [number, number] || [0, 1]}
              onValueChange={(value) => column.setFilterValue(value)}
              defaultValue={[0, 1]}
              min={0}
              max={1}
              step={0.01}
              minStepsBetweenThumbs={1}
            />
            <div className="flex justify-between text-xs">
              <span>{(((column.getFilterValue() as [number, number])?.[0] || 0) * 100).toFixed(1)}%</span>
              <span>{(((column.getFilterValue() as [number, number])?.[1] || 1) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
}

interface HeaderOptions<T> {
  enableSorting?: boolean;
  filterComponent?: (column: Column<T, unknown>) => JSX.Element;
}


function headerCell<T>(label: string, options: HeaderOptions<T> = {}) {
  const { enableSorting = false, filterComponent = undefined } = options;

  return ({ column }: { column: Column<T, unknown> }) => (
    <div className="flex items-center">
      <Button
        variant="ghost"
        onClick={() => enableSorting && column.toggleSorting(column.getIsSorted() === "asc")}
        disabled={!enableSorting}
      >
        {label}
        {enableSorting && <ArrowUpDown className="ml-2 h-4 w-4" />}
      </Button>
      {filterComponent && filterComponent(column)}
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
      filterComponent: partyFilter(Object.values(partyShortNames))
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
    accessorKey: "gb_area",
    header: headerCell("GB area", { enableSorting: true }),
    size: 150,
    meta: { minWidth: 120 },
    cell: ({ row }) => {
      const gb_area = row.original.gb_area
      return <span>{(gb_area / 1000000).toFixed(2)} km²</span>
    }
  },
  {
    accessorKey: "gb_pct",
    header: headerCell("GB pct", { enableSorting: true, filterComponent: pctFilter() }),
    size: 150,
    meta: { minWidth: 120 },
    cell: ratioCell("gb_pct"),
    filterFn: (row, id, filterValue: [number, number]) => {
      const value = row.getValue(id) as number;
      return value >= filterValue[0] && value <= filterValue[1];
    }
  },
  {
    accessorKey: "majority_pct",
    header: headerCell("Majority pct", { enableSorting: true, filterComponent: pctFilter() }),
    size: 150,
    meta: { minWidth: 120 },
    cell: ratioCell("majority_pct"),
    filterFn: (row, id, filterValue: [number, number]) => {
      const value = row.getValue(id) as number;
      return value >= filterValue[0] && value <= filterValue[1];
    }
  },
]
