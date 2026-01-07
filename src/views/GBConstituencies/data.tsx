import Papa from "papaparse";

export interface Constituency {
    PCON24CD: string;
    PCON24NM: string;
    winningParty: string;
    mpFullName: string;
    gb_area: number;
    gb_pct: number;
    najority: number;
    majority_pct: number;
}

export const loadConstituencies = async (): Promise<Constituency[]> => {
    const csvUrl = "/2024_constituencies_gb_pct.csv";

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
                        mpFullName: `${row['Member first name'] || ''} ${row['Member surname'] || ''}`.trim(), // Combined name
                        gb_area: row['gb_area'] || 0,
                        gb_pct: row['gb_pct'] || 0,
                        najority: row['Majority'],
                        majority_pct: row['Majority'] / row['Valid votes'],
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
