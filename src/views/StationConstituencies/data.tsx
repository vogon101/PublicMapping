import Papa from "papaparse";

export interface Constituency {
    PCON24CD: string;
    PCON24NM: string;
    winningParty: string;
    mpFullName: string;
    ratio800: number;
    ratio1000: number;
    ratio1200: number;
    ratio1500: number;
}

export const loadConstituencies = async (): Promise<Constituency[]> => {
    const csvUrl = "/constituency_station_overlap_with_results.csv";

    return new Promise((resolve, reject) => {
        Papa.parse(csvUrl, {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                console.log(results.data)
                const constituencies: Constituency[] = results.data
                    .filter((row: any) => row['Country name'] === 'England')
                    .map((row: any) => ({
                        PCON24CD: row['ONS ID'],
                        PCON24NM: row['Constituency name'],
                        winningParty: row['First party'],
                        mpFullName: `${row.mpFirstName || ''} ${row.mpSurname || ''}`.trim(), // Combined name
                        ratio800: parseFloat(row.ratio800) || 0,
                        ratio1000: parseFloat(row.ratio1000) || 0,
                        ratio1200: parseFloat(row.ratio1200) || 0,
                        ratio1500: parseFloat(row.ratio1500) || 0,
                    }));
                resolve(constituencies);
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                reject(error);
            }
        });
    });
};
