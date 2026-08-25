import Papa from "papaparse";

export interface ImportedOptionsResult {
    options: string[];
    skippedCount: number;
}

const MAX_OPTION_COUNT = 500;
const MAX_OPTION_LENGTH = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function normalizeOptions(
    rawValues: unknown[],
): ImportedOptionsResult {
    const options: string[] = [];
    const seen = new Set<string>();
    let skippedCount = 0;

    for (const value of rawValues) {
        let text = "";

        if (typeof value === "string") {
            text = value;
        } else if (
            isRecord(value) &&
            typeof value.text === "string"
        ) {
            text = value.text;
        }

        const normalizedText = text.trim();

        if (
            !normalizedText ||
            normalizedText.length > MAX_OPTION_LENGTH ||
            seen.has(normalizedText) ||
            options.length >= MAX_OPTION_COUNT
        ) {
            skippedCount++;
            continue;
        }

        seen.add(normalizedText);
        options.push(normalizedText);
    }

    if (options.length === 0) {
        throw new Error(
            "Dosyada kullanılabilir seçenek bulunamadı.",
        );
    }

    return {
        options,
        skippedCount,
    };
}

function parseCsv(content: string): unknown[] {
    const result = Papa.parse<string[]>(content, {
        delimiter: "",
        skipEmptyLines: "greedy",
    });

    const fatalErrors = result.errors.filter(
        (error) =>
            error.code !== "UndetectableDelimiter",
    );

    if (fatalErrors.length > 0) {
        throw new Error(
            "CSV dosyası okunamadı. Dosya biçimini kontrol edin.",
        );
    }

    const rows = result.data;

    if (rows.length === 0) {
        return [];
    }

    const firstCell = rows[0]?.[0]
        ?.trim()
        .toLocaleLowerCase("tr-TR");

    const headerNames = new Set([
        "seçenek",
        "option",
        "text",
    ]);

    const hasHeader =
        rows[0].length === 1 &&
        headerNames.has(firstCell);

    const dataRows = hasHeader
        ? rows.slice(1)
        : rows;

    for (const row of dataRows) {
        if (row.length > 1) {
            throw new Error(
                "CSV dosyası yalnızca tek sütun içermelidir.",
            );
        }
    }

    return dataRows.map((row) => row[0] ?? "");
}

export function parseOptionFile(
    fileName: string,
    content: string,
): ImportedOptionsResult {
    const extension = fileName
        .toLowerCase()
        .split(".")
        .pop();

    let rawValues: unknown[];

    if (extension === "txt") {
        rawValues = content.split(/\r?\n/);
    } else if (extension === "csv") {
        rawValues = parseCsv(content);
    } else if (extension === "json") {
        const parsed: unknown = JSON.parse(
            content.replace(/^\uFEFF/, ""),
        );

        if (Array.isArray(parsed)) {
            rawValues = parsed;
        } else if (
            isRecord(parsed) &&
            Array.isArray(parsed.options)
        ) {
            rawValues = parsed.options;
        } else {
            throw new Error(
                "JSON dosyası dizi veya options alanı içermelidir.",
            );
        }
    } else {
        throw new Error(
            "Yalnızca TXT, CSV veya JSON dosyası yükleyebilirsiniz.",
        );
    }

    return normalizeOptions(rawValues);
}