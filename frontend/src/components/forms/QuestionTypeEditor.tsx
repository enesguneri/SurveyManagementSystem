import {
    Alert,
    Button,
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
    const [optionApiUrl, setOptionApiUrl] = useState("");
    const [optionJsonPath, setOptionJsonPath] = useState("");
    const [optionTextProperty, setOptionTextProperty] =
        useState("text");

    const [isUrlImporting, setIsUrlImporting] =
        useState(false);
    const [urlImportError, setUrlImportError] = useState("");
    const [urlImportInfo, setUrlImportInfo] = useState("");
    const optionFileInputRef =
        useRef<HTMLInputElement>(null);

    const [importError, setImportError] = useState("");
    const [isImporting, setIsImporting] = useState(false);

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
                options: result.options,
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
        setUrlImportInfo("");

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
                options: response.data.options,
            });

            const skippedMessage =
                response.data.skippedCount > 0
                    ? ` ${response.data.skippedCount} kayıt atlandı.`
                    : "";

            setUrlImportInfo(
                `${response.data.options.length} seçenek içe aktarıldı.${skippedMessage}`,
            );
        } catch {
            setUrlImportError(
                "API bağlantısı kurulamadı.",
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
                            : "TXT / CSV / JSON'dan aktar"}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => {
                            setIsApiImportOpen(
                                (currentValue) => !currentValue,
                            );
                            setUrlImportError("");
                            setUrlImportInfo("");
                        }}
                    >
                        {isApiImportOpen
                            ? "API aktarımını kapat"
                            : "API'den seçenek aktar"}
                    </Button>

                    <input
                        ref={optionFileInputRef}
                        type="file"
                        accept=".txt,.csv,.json,text/plain,text/csv,application/json"
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
                            placeholder="Örneğin: data.items"
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
                            helperText="Nesne formatı için varsayılan alan: text"
                            fullWidth
                        />

                        <Button
                            variant="contained"
                            onClick={handleOptionUrlImport}
                            disabled={isUrlImporting}
                        >
                            {isUrlImporting
                                ? "API okunuyor..."
                                : "Seçenekleri getir"}
                        </Button>

                        {urlImportError && (
                            <Alert severity="error">
                                {urlImportError}
                            </Alert>
                        )}

                        {urlImportInfo && (
                            <Alert severity="success">
                                {urlImportInfo}
                            </Alert>
                        )}
                    </Stack>
                </Collapse>

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