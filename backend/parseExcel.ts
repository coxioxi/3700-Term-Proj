import * as XLSX from "xlsx";

interface Employee {
  name: string;
  phone: string;
  address: string;
  payRate: number;
  role: string;
  hoursWorked: number;
  team: string;
}

interface Client {
  name: string;
  address: string;
  cleaningValue: number;
  houseSize: number;
  paymentMethod: string;
  dayOfCleaning: string;
  timeOfCleaning: string;
  specialRequest: string;
  phone: string;
  typeClean: boolean;
  team: string;
}

/**
 * Convert Excel date serial number → ISO date
 */
function excelSerialToJSDate(serial: number): string {
  if (!serial || typeof serial !== "number") return "";

  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const jsDate = new Date(excelEpoch.getTime() + serial * 86400 * 1000);

  // Format as YYYY-MM-DD (local-safe because we use UTC fields)
  const year = jsDate.getUTCFullYear();
  const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = jsDate.getUTCDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/**
 * Convert Excel time fraction (e.g. 0.5 → "12:00")
 */
function excelTimeFractionToHHMM(serial: number): string {
  if (!serial || typeof serial !== "number") return "";
  const totalSeconds = Math.round(serial * 86400); // 24h * 60m * 60s
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export function parseWorkbook(workbook: XLSX.WorkBook) {
  const employees: Employee[] = [];
  const clients: Client[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
    }) as any[][];

    if (rows.length <= 1) return;

    let lastEmployee: Employee | null = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // New employee row
      if (row[0]) {
        lastEmployee = {
          name: String(row[0]).trim(),
          phone: String(row[1] ?? "").trim(),
          address: String(row[2] ?? "").trim(),
          payRate: Number(row[3] ?? 0),
          role: String(row[4] ?? "").trim(),
          hoursWorked: Number(row[5] ?? 0),
          team: sheetName,
        };

        employees.push(lastEmployee);
      }

      if (!lastEmployee) continue;

      // Client row
      if (row[6]) {
        const excelDate = row[11];
        const excelTime = row[12];

        clients.push({
          name: String(row[6]).trim(),
          address: String(row[7] ?? "").trim(),
          cleaningValue: Number(row[8] ?? 0),
          houseSize: Number(row[9] ?? 0),
          paymentMethod: String(row[10] ?? "").trim(),
          dayOfCleaning: excelSerialToJSDate(excelDate),
          timeOfCleaning: excelTimeFractionToHHMM(excelTime),
          specialRequest: String(row[13] ?? "").trim(),
          phone: String(row[14] ?? "").trim(),
          typeClean: Boolean(row[15]),
          team: sheetName,
        });
      }
    }
  });

  return { employees, clients };
}
