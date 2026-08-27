import { describe, expect, it } from "vitest";
import { parseOptionFile } from "../optionImport";

describe("optionImport utils", () => {
    describe("TXT Parsing", () => {
        it("should parse line-delimited text and trim whitespace", () => {
            const content = "Seçenek 1\n  Seçenek 2  \r\nSeçenek 3";
            const result = parseOptionFile("options.txt", content);

            expect(result.options).toEqual(["Seçenek 1", "Seçenek 2", "Seçenek 3"]);
            expect(result.skippedCount).toBe(0);
        });

        it("should deduplicate options in text files", () => {
            const content = "Evet\nHayır\nEvet\n  Hayır  ";
            const result = parseOptionFile("options.txt", content);

            expect(result.options).toEqual(["Evet", "Hayır"]);
            expect(result.skippedCount).toBe(2);
        });
    });

    describe("CSV Parsing", () => {
        it("should parse single column CSV with header", () => {
            const content = "seçenek\nİzmir\nAnkara\nİstanbul";
            const result = parseOptionFile("cities.csv", content);

            expect(result.options).toEqual(["İzmir", "Ankara", "İstanbul"]);
            expect(result.skippedCount).toBe(0);
        });

        it("should throw error if CSV has multiple columns", () => {
            const content = "Ad,Soyad\nAli,Veli";
            expect(() => parseOptionFile("data.csv", content)).toThrow(
                "CSV dosyası yalnızca tek sütun içermelidir.",
            );
        });
    });

    describe("JSON Parsing", () => {
        it("should parse raw JSON string array", () => {
            const content = '["Lisans", "Yüksek Lisans", "Doktora"]';
            const result = parseOptionFile("levels.json", content);

            expect(result.options).toEqual(["Lisans", "Yüksek Lisans", "Doktora"]);
            expect(result.skippedCount).toBe(0);
        });

        it("should parse JSON object with options array", () => {
            const content = JSON.stringify({
                options: [
                    { text: "Bölüm A" },
                    { text: "Bölüm B" },
                ],
            });
            const result = parseOptionFile("departments.json", content);

            expect(result.options).toEqual(["Bölüm A", "Bölüm B"]);
            expect(result.skippedCount).toBe(0);
        });

        it("should strip UTF-8 BOM from JSON content", () => {
            const content = '\uFEFF["BOM Test 1", "BOM Test 2"]';
            const result = parseOptionFile("bom.json", content);

            expect(result.options).toEqual(["BOM Test 1", "BOM Test 2"]);
        });
    });

    describe("Validation and Edge Cases", () => {
        it("should throw error for unsupported file extension", () => {
            expect(() => parseOptionFile("options.pdf", "data")).toThrow(
                "Yalnızca TXT, CSV veya JSON dosyası yükleyebilirsiniz.",
            );
        });

        it("should throw error if no valid options found", () => {
            expect(() => parseOptionFile("empty.txt", "   \n\n  \r\n")).toThrow(
                "Dosyada kullanılabilir seçenek bulunamadı.",
            );
        });

        it("should enforce MAX_OPTION_COUNT (500)", () => {
            const manyOptions = Array.from({ length: 600 }, (_, i) => `Option ${i + 1}`).join("\n");
            const result = parseOptionFile("large.txt", manyOptions);

            expect(result.options.length).toBe(500);
            expect(result.skippedCount).toBe(100);
        });
    });
});
