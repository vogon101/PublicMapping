export const parties = [
  { short: "Lab", long: "Labour", color: "#DC2626", textColor: "#FFFFFF" },
  { short: "Con", long: "Conservative", color: "#06B6D4", textColor: "#FFFFFF" },
  { short: "LD", long: "Liberal Democrat", color: "#F59E0B", textColor: "#FFFFFF" },
  { short: "Green", long: "Green", color: "#02A95B", textColor: "#FFFFFF" },
//   { short: "SNP", long: "SNP", color: "#E11D48", textColor: "#FFFFFF" },
//   { short: "PC", long: "Plaid Cymru", color: "#0891B2", textColor: "#FFFFFF" },
  { short: "Ind", long: "Independent", color: "#777777", textColor: "#FFFFFF" },
  { short: "Other", long: "Other", color: "#CCCCCC", textColor: "#FFFFFF" },
  { short: "RUK", long: "Reform UK", color: "#12B6CF", textColor: "#FFFFFF" },
  { short: "Spk", long: "Speaker", color: "#777777", textColor: "#FFFFFF" },
  // Add other parties as needed
]

export const partyColors: { [key: string]: string } = parties.reduce((acc, party) => {
  acc[party.short] = party.color
  return acc
}, {} as { [key: string]: string })

export const partyTextColors: { [key: string]: string } = parties.reduce((acc, party) => {
  acc[party.short] = party.textColor
  return acc
}, {} as { [key: string]: string })

export const partyNames: { [key: string]: string } = parties.reduce((acc, party) => {
  acc[party.short] = party.long
  return acc
}, {} as { [key: string]: string })

export const partyShortNames: { [key: string]: string } = parties.reduce((acc, party) => {
  acc[party.long] = party.short
  return acc
}, {} as { [key: string]: string })