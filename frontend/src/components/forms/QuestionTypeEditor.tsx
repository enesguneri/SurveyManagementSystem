import {
    Button,
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

interface QuestionTypeEditorProps {
    question: QuestionDraft;
    onChange: (update: Partial<QuestionDraft>) => void;
}

export default function QuestionTypeEditor({
                                               question,
                                               onChange,
                                           }: QuestionTypeEditorProps) {
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
        question.type === "MultipleChoice"
    ) {
        return (
            <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Seçenekler
                </Typography>

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