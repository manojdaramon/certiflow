export interface CandidateRow {
    fullName: string;
    nationalId: string;
    phone: string;
    email?: string;
    grade: string;
    completionDate: Date;
}

export interface RowError {
    row: number;
    column: string;
    value?: string;
    message: string;
}

export interface ParseResult {
    isValid: boolean;
    candidates: CandidateRow[];
    errors: RowError[];
    totalRows: number;
}

/**
 * Parses CSV content handling quoted strings, linebreaks and standard CSV formats.
 */
function parseCSV(content: string): string[][] {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;

    // Normalize newlines
    const text = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++; // skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = "";
        } else if (char === "\n" && !inQuotes) {
            currentRow.push(currentField.trim());
            if (currentRow.some((f) => f.length > 0)) {
                lines.push(currentRow);
            }
            currentRow = [];
            currentField = "";
        } else {
            currentField += char;
        }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
            lines.push(currentRow);
        }
    }

    return lines;
}

/**
 * Normalizes column header names to standard keys.
 */
function normalizeHeader(header: string): string {
    const cleaned = header.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleaned.includes("fullname") || cleaned === "name" || cleaned.includes("candidatename")) {
        return "fullName";
    }
    if (cleaned.includes("nationalid") || cleaned.includes("aadhaar") || cleaned.includes("candidateid") || cleaned === "id") {
        return "nationalId";
    }
    if (cleaned.includes("phone") || cleaned.includes("mobile") || cleaned.includes("contact") || cleaned.includes("whatsapp")) {
        return "phone";
    }
    if (cleaned.includes("email")) {
        return "email";
    }
    if (cleaned.includes("grade") || cleaned.includes("result") || cleaned.includes("score")) {
        return "grade";
    }
    if (cleaned.includes("date") || cleaned.includes("completion") || cleaned.includes("passing")) {
        return "completionDate";
    }
    return cleaned;
}

/**
 * Validates candidates CSV spreadsheet with all-or-nothing atomicity.
 * If any row fails, isValid will be false and all errors are detailed.
 */
export function validateCandidateCSV(csvContent: string): ParseResult {
    const rows = parseCSV(csvContent);
    const errors: RowError[] = [];
    const candidates: CandidateRow[] = [];

    if (rows.length < 2) {
        return {
            isValid: false,
            candidates: [],
            errors: [{ row: 1, column: "file", message: "CSV file is empty or missing data rows" }],
            totalRows: 0
        };
    }

    const rawHeaders = rows[0];
    const headerMap: Record<string, number> = {};

    rawHeaders.forEach((h, idx) => {
        const key = normalizeHeader(h);
        headerMap[key] = idx;
    });

    const requiredHeaders = ["fullName", "nationalId", "phone", "grade", "completionDate"];
    const missingHeaders = requiredHeaders.filter((req) => headerMap[req] === undefined);

    if (missingHeaders.length > 0) {
        return {
            isValid: false,
            candidates: [],
            errors: [
                {
                    row: 1,
                    column: "headers",
                    message: `Missing required columns: ${missingHeaders.join(", ")}. Expected columns: Full Name, National ID, Phone, Grade, Completion Date`
                }
            ],
            totalRows: rows.length - 1
        };
    }

    const seenNationalIds = new Set<string>();

    for (let i = 1; i < rows.length; i++) {
        const rowNum = i + 1; // 1-based index including header
        const row = rows[i];

        const fullName = (row[headerMap["fullName"]] || "").trim();
        const nationalId = (row[headerMap["nationalId"]] || "").trim();
        let phone = (row[headerMap["phone"]] || "").trim();
        const email = headerMap["email"] !== undefined ? (row[headerMap["email"]] || "").trim() : undefined;
        const grade = (row[headerMap["grade"]] || "").trim();
        const dateStr = (row[headerMap["completionDate"]] || "").trim();

        // 1. Validate Full Name
        if (!fullName || fullName.length < 2) {
            errors.push({
                row: rowNum,
                column: "fullName",
                value: fullName,
                message: "Full name must be at least 2 characters long."
            });
        }

        // 2. Validate National ID
        if (!nationalId) {
            errors.push({
                row: rowNum,
                column: "nationalId",
                message: "National ID / Aadhaar is required."
            });
        } else if (seenNationalIds.has(nationalId.toLowerCase())) {
            errors.push({
                row: rowNum,
                column: "nationalId",
                value: nationalId,
                message: `Duplicate National ID '${nationalId}' found within this spreadsheet.`
            });
        } else {
            seenNationalIds.add(nationalId.toLowerCase());
        }

        // 3. Validate Phone Number
        // Remove spaces, dashes, or +91 prefix
        phone = phone.replace(/[\s\-]/g, "");
        if (phone.startsWith("+91")) phone = phone.substring(3);
        if (phone.startsWith("91") && phone.length === 12) phone = phone.substring(2);

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            errors.push({
                row: rowNum,
                column: "phone",
                value: row[headerMap["phone"]],
                message: "Invalid phone number. Must be a valid 10-digit Indian mobile number."
            });
        }

        // 4. Validate Email (optional)
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push({
                    row: rowNum,
                    column: "email",
                    value: email,
                    message: "Invalid email format."
                });
            }
        }

        // 5. Validate Grade
        if (!grade) {
            errors.push({
                row: rowNum,
                column: "grade",
                message: "Grade or result is required (e.g. Pass, Distinction, A, B)."
            });
        }

        // 6. Validate Completion Date
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
            errors.push({
                row: rowNum,
                column: "completionDate",
                value: dateStr,
                message: "Invalid completion date. Use YYYY-MM-DD format."
            });
        } else if (parsedDate > new Date()) {
            errors.push({
                row: rowNum,
                column: "completionDate",
                value: dateStr,
                message: "Completion date cannot be in the future."
            });
        }

        if (errors.length === 0) {
            candidates.push({
                fullName,
                nationalId,
                phone,
                email: email || undefined,
                grade,
                completionDate: parsedDate
            });
        }
    }

    return {
        isValid: errors.length === 0,
        candidates: errors.length === 0 ? candidates : [],
        errors,
        totalRows: rows.length - 1
    };
}
