import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    Collapse,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type {
    QuestionDraft,
    QuestionValidationDraft,
} from "../../types/form";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { parseOptionFile } from "../../utils/optionImport";
import { previewOptionsFromUrl } from "../../api/optionApi";

interface QuestionTypeEditorProps {
    question: QuestionDraft;
    onChange: (update: Partial<QuestionDraft>) => void;
}

export default function QuestionTypeEditor({
                                               question,
                                               onChange,
                                           }: QuestionTypeEditorProps) {
    const [optionApiUrl, setOptionApiUrl] = useState(
        question.optionSourceUrl ?? ""
    );
    const [optionJsonPath, setOptionJsonPath] = useState(
        question.optionJsonPath ?? ""
    );
    const [optionTextProperty, setOptionTextProperty] = useState(
        question.optionTextProperty ?? "text"
    );

    const [isUrlImporting, setIsUrlImporting] =
        useState(false);
    const [urlImportError, setUrlImportError] = useState("");
    const optionFileInputRef =
        useRef<HTMLInputElement>(null);

    const [importError, setImportError] = useState("");
    const [isImporting, setIsImporting] = useState(false);

    const [apiTestResult, setApiTestResult] = useState<{
        totalCount: number;
        sampleOptions: string[];
    } | null>(null);

    const [txtTestResult, setTxtTestResult] = useState<{
        totalCount: number;
        sampleOptions: string[];
    } | null>(null);

    const [isApiImportOpen, setIsApiImportOpen] =
        useState(false);

    async function handleOptionFileImport(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) {
            return;
        }

        setImportError("");
        setIsImporting(true);

        try {
            const content = await file.text();
            const result = parseOptionFile(file.name, content);

            onChange({
                options: [], // Veritabanına önceden eklenmez; katılımcı seçtikçe kaydedilir
                optionSourceType: "Txt",
                optionFileContent: content,
            });

            setTxtTestResult({
                totalCount: result.options.length,
                sampleOptions: result.options.slice(0, 20),
            });
        } catch (error) {
            setImportError(
                error instanceof Error
                    ? error.message
                    : "Seçenek dosyası okunamadı.",
            );
        } finally {
            setIsImporting(false);
        }
    }
    async function handleOptionUrlImport() {
        setUrlImportError("");

        if (!optionApiUrl.trim()) {
            setUrlImportError(
                "Lütfen bir HTTPS API adresi girin.",
            );
            return;
        }

        setIsUrlImporting(true);

        try {
            const response = await previewOptionsFromUrl({
                url: optionApiUrl.trim(),
                jsonPath: optionJsonPath.trim(),
                textProperty:
                    optionTextProperty.trim() || "text",
            });

            if (!response.isSuccess || !response.data) {
                setUrlImportError(
                    response.errors?.join(" ") ??
                    response.message ??
                    "API seçenekleri alınamadı.",
                );
                return;
            }

            onChange({
                options: [], // Veritabanına önceden eklenmez; katılımcı seçtikçe kaydedilir
                optionSourceType: "Api",
                optionSourceUrl: optionApiUrl.trim(),
                optionJsonPath: optionJsonPath.trim() || null,
                optionTextProperty: optionTextProperty.trim() || "text",
            });

            setApiTestResult({
                totalCount: response.data.options.length,
                sampleOptions: response.data.options.slice(0, 20),
            });
        } catch {
            setUrlImportError(
                "API bağlantısı kurulamadı. URL ve CORS ayarlarını kontrol edin.",
            );
        } finally {
            setIsUrlImporting(false);
        }
    }

    function updateValidation(
        update: Partial<QuestionValidationDraft>,
    ) {
        onChange({
            validation: {
                ...question.validation,
                ...update,
            },
        });
    }

    function updateOption(index: number, value: string) {
        const options = [...question.options];
        options[index] = value;
        onChange({ options });
    }

    function updateMatrixRow(index: number, value: string) {
        const matrixRows = [...question.matrixRows];
        matrixRows[index] = value;
        onChange({ matrixRows });
    }

    function updateMatrixColumn(index: number, value: string) {
        const matrixColumns = [...question.matrixColumns];
        matrixColumns[index] = value;
        onChange({ matrixColumns });
    }

    if (
        question.type === "SingleChoice" ||
        question.type === "Dropdown" ||
        question.type === "MultipleChoice"
    ) {
        return (
            <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Seçenekler
                </Typography>

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                >
                    <Button
                        variant="outlined"
                        onClick={() =>
                            optionFileInputRef.current?.click()
                        }
                        disabled={isImporting}
                    >
                        {isImporting
                            ? "İçe aktarılıyor..."
                            : "TXT Dosyasından Aktar"}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => {
                            setIsApiImportOpen(
                                (currentValue) => !currentValue,
                            );
                            setUrlImportError("");
                        }}
                    >
                        {isApiImportOpen
                            ? "API aktarımını kapat"
                            : "API'den seçenek aktar"}
                    </Button>

                    <input
                        ref={optionFileInputRef}
                        type="file"
                        accept=".txt,text/plain"
                        hidden
                        onChange={handleOptionFileImport}
                    />
                </Stack>

                {importError && (
                    <Alert severity="error">
                        {importError}
                    </Alert>
                )}

                <Collapse
                    in={isApiImportOpen}
                    unmountOnExit
                >
                    <Stack
                        spacing={2}
                        sx={{
                            mt: 1,
                            p: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            backgroundColor: "background.paper",
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                        >
                            Harici API'den seçenek aktar
                        </Typography>

                        <TextField
                            label="Seçenek API adresi"
                            placeholder="https://example.com/options"
                            value={optionApiUrl}
                            onChange={(event) =>
                                setOptionApiUrl(event.target.value)
                            }
                            helperText="Yalnızca HTTPS adresleri kabul edilir."
                            fullWidth
                        />

                        <TextField
                            label="JSON yolu"
                            placeholder="Örneğin: users"
                            value={optionJsonPath}
                            onChange={(event) =>
                                setOptionJsonPath(event.target.value)
                            }
                            helperText="Kök dizi için boş bırakabilirsiniz."
                            fullWidth
                        />

                        <TextField
                            label="Seçenek metin alanı"
                            value={optionTextProperty}
                            onChange={(event) =>
                                setOptionTextProperty(event.target.value)
                            }
                            helperText="Nesne formatı için varsayılan alan: firstName, name vb."
                            fullWidth
                        />

                        <Button
                            variant="contained"
                            onClick={handleOptionUrlImport}
                            disabled={isUrlImporting}
                        >
                            {isUrlImporting
                                ? "Bağlantı test ediliyor..."
                                : "Bağlantıyı Test Et"}
                        </Button>

                        {urlImportError && (
                            <Alert severity="error">
                                {urlImportError}
                            </Alert>
                        )}

                        {apiTestResult && (
                            <Stack
                                spacing={1}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    bgcolor: "success.50",
                                    border: "1px solid",
                                    borderColor: "success.200",
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600, color: "success.dark" }}
                                >
                                    ✅ Bağlantı başarılı! Toplam {apiTestResult.totalCount} sonuç bulundu.
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 600, color: "text.secondary" }}
                                >
                                    İlk {Math.min(apiTestResult.totalCount, 20)} örnek seçenek:
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 0.5,
                                        maxHeight: 120,
                                        overflowY: "auto",
                                    }}
                                >
                                    {apiTestResult.sampleOptions.map((sample, idx) => (
                                        <Chip
                                            key={idx}
                                            label={sample}
                                            size="small"
                                            variant="outlined"
                                            color="success"
                                        />
                                    ))}
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.secondary",
                                        fontStyle: "italic",
                                        mt: 0.5,
                                    }}
                                >
                                    ℹ️ Bilgi: Seçenekler veritabanına önceden eklenmez. Anket yanıtlanırken API'den dinamik çekilecek ve yalnızca katılımcıların işaretlediği seçenekler veritabanında saklanacaktır.
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                </Collapse>

                {txtTestResult && (
                    <Stack
                        spacing={1}
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: "success.50",
                            border: "1px solid",
                            borderColor: "success.200",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "success.dark" }}
                        >
                            ✅ TXT dosyası doğrulandı! Toplam {txtTestResult.totalCount} satır tespit edildi.
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: "text.secondary" }}
                        >
                            İlk {Math.min(txtTestResult.totalCount, 20)} örnek seçenek:
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                                maxHeight: 120,
                                overflowY: "auto",
                            }}
                        >
                            {txtTestResult.sampleOptions.map((sample, idx) => (
                                <Chip
                                    key={idx}
                                    label={sample}
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                />
                            ))}
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{
                                color: "text.secondary",
                                fontStyle: "italic",
                                mt: 0.5,
                            }}
                        >
                            ℹ️ Bilgi: Seçenekler veritabanına önceden eklenmez. Katılımcılar formu doldururken sunulacak ve yalnızca katılımcıların işaretlediği seçenekler veritabanında saklanacaktır.
                        </Typography>
                    </Stack>
                )}

                {question.optionSourceType === "Api" ? (
                    <Card
                        variant="outlined"
                        sx={{
                            p: 2,
                            bgcolor: "info.50",
                            borderColor: "info.200",
                            borderRadius: 2,
                        }}
                    >
                        <Stack spacing={1}>
                            <Stack
                                direction="row"
                                sx={{
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700, color: "info.dark" }}
                                >
                                    🌐 Harici API Seçenek Kaynağı Aktif
                                </Typography>
                                <Button
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    onClick={() => {
                                        onChange({
                                            optionSourceType: "None",
                                            optionSourceUrl: null,
                                            optionJsonPath: null,
                                            optionTextProperty: null,
                                            options: ["", ""],
                                        });
                                        setApiTestResult(null);
                                    }}
                                >
                                    Manuel Seçeneklere Dön
                                </Button>
                            </Stack>
                            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                <strong>API URL:</strong> {question.optionSourceUrl}
                            </Typography>
                            {question.optionJsonPath && (
                                <Typography variant="body2">
                                    <strong>JSON Yolu:</strong> {question.optionJsonPath}
                                </Typography>
                            )}
                            {question.optionTextProperty && (
                                <Typography variant="body2">
                                    <strong>Seçenek Alanı:</strong> {question.optionTextProperty}
                                </Typography>
                            )}
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Katılımcı anket doldururken seçenekler bu adresten dinamik çekilecek ve veritabanına yalnızca işaretlenen seçenekler eklenecektir.
                            </Typography>
                        </Stack>
                    </Card>
                ) : question.optionSourceType === "Txt" ? (
                    <Card
                        variant="outlined"
                        sx={{
                            p: 2,
                            bgcolor: "info.50",
                            borderColor: "info.200",
                            borderRadius: 2,
                        }}
                    >
                        <Stack spacing={1}>
                            <Stack
                                direction="row"
                                sx={{
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700, color: "info.dark" }}
                                >
                                    📄 Dinamik TXT Seçenek Kaynağı Aktif
                                </Typography>
                                <Button
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    onClick={() => {
                                        onChange({
                                            optionSourceType: "None",
                                            optionFileContent: null,
                                            options: ["", ""],
                                        });
                                        setTxtTestResult(null);
                                    }}
                                >
                                    Manuel Seçeneklere Dön
                                </Button>
                            </Stack>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Katılımcı anket doldururken seçenekler bu dosyadan dinamik sunulacak ve veritabanına yalnızca işaretlenen seçenekler eklenecektir.
                            </Typography>
                        </Stack>
                    </Card>
                ) : (
                    <>
                        {question.options.length > 0 && (
                            <Box
                                sx={{
                                    maxHeight: 320,
                                    overflowY: "auto",
                                    pr: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                }}
                            >
                                {question.options.map((option, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        spacing={1}
                                        sx={{ alignItems: "center" }}
                                    >
                                        <TextField
                                            label={`${index + 1}. seçenek`}
                                            value={option}
                                            onChange={(event) =>
                                                updateOption(index, event.target.value)
                                            }
                                            fullWidth
                                        />

                                        <IconButton
                                            color="error"
                                            onClick={() =>
                                                onChange({
                                                    options: question.options.filter(
                                                        (_, optionIndex) => optionIndex !== index,
                                                    ),
                                                })
                                            }
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                ))}
                            </Box>
                        )}

                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() =>
                                onChange({
                                    options: [...question.options, ""],
                                })
                            }
                        >
                            Seçenek Ekle
                        </Button>
                    </>
                )}
            </Stack>
        );
    }

    if (
        question.type === "MultipleChoiceGrid" ||
        question.type === "CheckboxGrid"
    ) {
        return (
            <Stack spacing={3}>
                <ListEditor
                    title="Tablo satırları"
                    values={question.matrixRows}
                    onChange={updateMatrixRow}
                    onAdd={() =>
                        onChange({
                            matrixRows: [...question.matrixRows, ""],
                        })
                    }
                    onRemove={(index) =>
                        onChange({
                            matrixRows: question.matrixRows.filter(
                                (_, rowIndex) => rowIndex !== index,
                            ),
                        })
                    }
                />

                <ListEditor
                    title="Tablo sütunları"
                    values={question.matrixColumns}
                    onChange={updateMatrixColumn}
                    onAdd={() =>
                        onChange({
                            matrixColumns: [...question.matrixColumns, ""],
                        })
                    }
                    onRemove={(index) =>
                        onChange({
                            matrixColumns: question.matrixColumns.filter(
                                (_, columnIndex) => columnIndex !== index,
                            ),
                        })
                    }
                />
            </Stack>
        );
    }

    if (question.type === "Date") {
        return (
            <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Tarih doğrulaması
                </Typography>

                <TextField
                    label="Minimum tarih"
                    type="date"
                    value={question.validation.minDate ?? ""}
                    onChange={(event) =>
                        updateValidation({
                            minDate: event.target.value || null,
                        })
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                />

                <TextField
                    label="Maksimum tarih"
                    type="date"
                    value={question.validation.maxDate ?? ""}
                    onChange={(event) =>
                        updateValidation({
                            maxDate: event.target.value || null,
                        })
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                />
            </Stack>
        );
    }

    if (question.type === "Rating") {
        return (
            <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Derecelendirme aralığı
                </Typography>

                <TextField
                    label="Minimum değer"
                    type="number"
                    value={question.validation.minValue ?? ""}
                    onChange={(event) =>
                        updateValidation({
                            minValue:
                                event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                        })
                    }
                />

                <TextField
                    label="Maksimum değer"
                    type="number"
                    value={question.validation.maxValue ?? ""}
                    onChange={(event) =>
                        updateValidation({
                            maxValue:
                                event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                        })
                    }
                />
            </Stack>
        );
    }

    if (
        question.type === "ShortText" ||
        question.type === "LongText"
    ) {
        return (
            <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Metin doğrulaması
                </Typography>

                <TextField
                    label="Minimum karakter"
                    type="number"
                    value={question.validation.minLength ?? ""}
                    onChange={(event) =>
                        updateValidation({
                            minLength:
                                event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                        })
                    }
                />

                <TextField
                    label="Maksimum karakter"
                    type="number"
                    value={question.validation.maxLength ?? ""}
                    onChange={(event) =>
                        updateValidation({
                            maxLength:
                                event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                        })
                    }
                />

                <TextField
                    label="Regex deseni"
                    value={question.validation.regexPattern}
                    onChange={(event) =>
                        updateValidation({
                            regexPattern: event.target.value,
                        })
                    }
                />
            </Stack>
        );
    }

    return null;
}

interface ListEditorProps {
    title: string;
    values: string[];
    onChange: (index: number, value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

function ListEditor({
                        title,
                        values,
                        onChange,
                        onAdd,
                        onRemove,
                    }: ListEditorProps) {
    return (
        <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {title}
            </Typography>

            {values.map((value, index) => (
                <Stack
                    key={index}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                >
                    <TextField
                        label={`${index + 1}. kayıt`}
                        value={value}
                        onChange={(event) =>
                            onChange(index, event.target.value)
                        }
                    />

                    <IconButton color="error" onClick={() => onRemove(index)}>
                        <DeleteIcon />
                    </IconButton>
                </Stack>
            ))}

            <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAdd}
            >
                Ekle
            </Button>
        </Stack>
    );
}