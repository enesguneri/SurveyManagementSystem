import { useEffect, useState } from "react";
import {
    Alert,
    Autocomplete,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    Divider,
    FormControlLabel,
    FormGroup,
    Radio,
    RadioGroup,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
    getPublishedForm,
    submitFormResponse,
} from "../api/formApi";
import { previewOptionsFromUrl } from "../api/optionApi";
import { extractErrorMessage } from "../utils/errorHandler";
import type {
    PublishedForm,
    PublishedQuestion,
    PublishedTextItem,
} from "../types/publishedForm";
import type {
    SubmitAnswerRequest,
    SubmitFormResponseRequest,
    SubmitMatrixCellRequest,
} from "../types/response";
import axios from "axios";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BrandHeader from "../components/layout/BrandHeader";

function createEmptyAnswer(
    questionId: number,
): SubmitAnswerRequest {
    return {
        questionId,
        textValue: null,
        numericValue: null,
        dateValue: null,
        selectedOptionIds: [],
        matrixSelections: [],
    };
}

function PublishedFormPage() {
    const [form, setForm] = useState<PublishedForm | null>(null);
    const [answers, setAnswers] = useState<
        Record<number, SubmitAnswerRequest>
    >({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const navigate = useNavigate();
    const { publicId } = useParams<{ publicId: string }>();
    const [searchParams] = useSearchParams();

    const isPreviewQuery = searchParams.get("preview") === "true";
    const isPreviewMode =
        isPreviewQuery ||
        Boolean(form?.isPreview) ||
        Boolean(form?.isClosedPreview) ||
        form?.status === "Draft" ||
        form?.status === "Closed" ||
        (Boolean(form?.canManage) && isPreviewQuery);

    const [isCopySnackbarOpen, setIsCopySnackbarOpen] = useState(false);

    function handleCopyShareLink() {
        if (!publicId) return;
        const url = `${window.location.origin}/forms/${publicId}`;
        void navigator.clipboard.writeText(url).then(() => {
            setIsCopySnackbarOpen(true);
        });
    }

    function handleTestSubmitPreview() {
        if (!form) return;
        const missing = form.questions.filter((q) => {
            if (!q.isRequired) return false;
            const ans = answers[q.id];
            if (!ans) return true;
            if (q.type === "MultipleChoiceGrid" || q.type === "CheckboxGrid") {
                return q.matrixRows.some(
                    (row) =>
                        !ans.matrixSelections.some(
                            (cell) => cell.matrixRowId === row.id,
                        ),
                );
            }
            if (q.type === "Rating") {
                return ans.numericValue === null;
            }
            if (q.type === "Date") {
                return !ans.dateValue;
            }
            if (
                q.type === "SingleChoice" ||
                q.type === "Dropdown" ||
                q.type === "MultipleChoice"
            ) {
                return ans.selectedOptionIds.length === 0;
            }
            return !ans.textValue?.trim();
        });

        if (missing.length > 0) {
            setErrorMessage(
                `Zorunlu ${missing.length} adet soru yanıtlanmamış: ${missing
                    .map((q) => `"${q.title}"`)
                    .join(", ")}`,
            );
            setSuccessMessage("");
            return;
        }

        setErrorMessage("");
        setSuccessMessage(
            "✅ Önizleme Testi Başarılı! Tüm zorunlu alanlar ve form kontrolleri eksiksiz çalışıyor. (Önizleme modunda yanıtlar veritabanına kaydedilmez).",
        );
    }

    const [hasSubmitted, setHasSubmitted] =
        useState(false);

    const [isSubmissionCompleted, setIsSubmissionCompleted] =
        useState(false);

    useEffect(() => {
        async function loadForm() {
            if (!publicId) {
                setErrorMessage("Anket bağlantısı geçersiz.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await getPublishedForm(publicId);

                if (!response.isSuccess || !response.data) {
                    setErrorMessage(
                        response.message ?? "Anket yüklenemedi.",
                    );
                    return;
                }

                setForm(response.data);
                setHasSubmitted(response.data.hasCurrentUserResponded,);

                const initialAnswers =
                    response.data.questions.reduce<
                        Record<number, SubmitAnswerRequest>
                    >((result, question) => {
                        result[question.id] =
                            createEmptyAnswer(question.id);
                        return result;
                    }, {});

                setAnswers(initialAnswers);
            } catch (error) {
                // Authenticated form için backend 401 döndürür.
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 401 &&
                    publicId
                ) {
                    const returnUrl = `/forms/${publicId}`;

                    navigate(
                        `/login?returnUrl=${encodeURIComponent(returnUrl)}`,
                        { replace: true },
                    );

                    return;
                }

                setErrorMessage(
                    extractErrorMessage(error, "Anket yüklenirken bir hata oluştu."),
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadForm();
    }, [publicId, navigate]);

    function updateAnswer(
        questionId: number,
        changes: Partial<SubmitAnswerRequest>,
    ) {
        setAnswers((currentAnswers) => ({
            ...currentAnswers,
            [questionId]: {
                ...(currentAnswers[questionId] ??
                    createEmptyAnswer(questionId)),
                ...changes,
            },
        }));
    }


    function toggleMatrixCell(
        question: PublishedQuestion,
        cell: SubmitMatrixCellRequest,
    ) {
        const currentAnswer =
            answers[question.id] ?? createEmptyAnswer(question.id);

        const isSelected = currentAnswer.matrixSelections.some(
            (selection) =>
                selection.matrixRowId === cell.matrixRowId &&
                selection.matrixColumnId === cell.matrixColumnId,
        );

        let matrixSelections =
            currentAnswer.matrixSelections;

        if (question.type === "MultipleChoiceGrid") {
            // Çoktan seçmeli tabloda her satır için yalnızca
            // bir sütun seçilebilir.
            matrixSelections = matrixSelections.filter(
                (selection) =>
                    selection.matrixRowId !== cell.matrixRowId,
            );
        }

        if (!isSelected) {
            matrixSelections = [
                ...matrixSelections,
                cell,
            ];
        }

        updateAnswer(question.id, { matrixSelections });
    }

    async function handleSubmit() {
        if (!publicId || !form) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        const request: SubmitFormResponseRequest = {
            answers: form.questions
                .sort(
                    (first, second) =>
                        first.displayOrder -
                        second.displayOrder,
                )
                .map((question) => {
                    const rawAnswer =
                        answers[question.id] ??
                        createEmptyAnswer(question.id);

                    if (
                        rawAnswer.selectedOptionIds.length > 0 &&
                        (!rawAnswer.selectedOptionTexts ||
                            rawAnswer.selectedOptionTexts.length === 0)
                    ) {
                        const texts = question.options
                            .filter((opt) =>
                                rawAnswer.selectedOptionIds.includes(opt.id),
                            )
                            .map((opt) => opt.text);

                        return {
                            ...rawAnswer,
                            selectedOptionTexts: texts,
                            textValue:
                                rawAnswer.textValue ||
                                (texts.length === 1 ? texts[0] : null),
                        };
                    }

                    return rawAnswer;
                }),
        };

        try {
            const response = await submitFormResponse(
                publicId,
                request,
            );

            if (!response.isSuccess) {
                setErrorMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "Anket yanıtı gönderilemedi.",
                );
                return;
            }

            setHasSubmitted(true);
            setIsSubmissionCompleted(true);

            setSuccessMessage(
                "Anket yanıtınız başarıyla gönderildi.",
            );
        } catch (error) {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 409
            ) {
                setHasSubmitted(true);
                setErrorMessage(
                    "Bu ankete daha önce yanıt verdiniz.",
                );
                return;
            }

            setErrorMessage(
                extractErrorMessage(error, "Yanıt gönderilirken bir hata oluştu."),
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <Stack
                sx={{
                    minHeight: "100vh",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Stack>
        );
    }

    if (errorMessage && !form) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Alert severity="error">
                    {errorMessage}
                </Alert>
            </Container>
        );
    }

    if (!form) {
        return null;
    }

    const sortedQuestions = [...form.questions].sort(
        (first, second) =>
            first.displayOrder - second.displayOrder,
    );

    return (
        <>
            <BrandHeader pageTitle="Anket" />
            <Container maxWidth="md" sx={{ py: 5 }}>
            <Stack spacing={3}>
                <Card>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography variant="h4">
                                {form.title}
                            </Typography>

                            {form.description && (
                                <Typography color="text.secondary">
                                    {form.description}
                                </Typography>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {isPreviewMode && (
                    <Card
                        variant="outlined"
                        sx={{
                            p: 2,
                            bgcolor: "info.50",
                            borderColor: "info.300",
                            borderRadius: 2,
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Stack
                                direction="row"
                                sx={{
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 1,
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ alignItems: "center" }}
                                >
                                    <VisibilityIcon color="info" />
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 700,
                                            color: "info.dark",
                                        }}
                                    >
                                        Yönetici Önizleme Modu
                                    </Typography>
                                    <Chip
                                        label={
                                            form.status === "Draft"
                                                ? "Taslak"
                                                : form.status === "Published"
                                                ? "Yayında"
                                                : "Kapatıldı"
                                        }
                                        size="small"
                                        color={
                                            form.status === "Published"
                                                ? "success"
                                                : form.status === "Draft"
                                                ? "warning"
                                                : "default"
                                        }
                                    />
                                </Stack>

                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={handleCopyShareLink}
                                >
                                    Katılımcı Bağlantısını Kopyala
                                </Button>
                            </Stack>

                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                {form.status === "Draft"
                                    ? "Bu anket henüz taslak aşamasındadır. Katılımcılar bu bağlantıya erişemez. Bu ekranda anketin katılımcılara nasıl görüneceğini test edebilirsiniz."
                                    : form.status === "Closed"
                                    ? "Bu anket kapatılmıştır. Katılımcılardan yeni yanıt kabul edilmez. Soruları inceleyebilirsiniz."
                                    : "Anket yayındadır ancak siz Yönetici Önizleme Modundasınız. Bu ekranda yapacağınız form denemeleri veritabanına kaydedilmez ve gerçek yanıt istatistiklerini kirletmez."}
                            </Typography>
                        </Stack>
                    </Card>
                )}

                {form.accessType === "Authenticated" &&
                    form.showRespondentIdentity && (
                        <Alert severity="info">
                            Bu anketi doldurduğunuzda adınız, anket sahibinin
                            yanıt sonuçlarında gösterilecektir.
                        </Alert>
                    )}

                {errorMessage && (
                    <Alert severity="error">
                        {errorMessage}
                    </Alert>
                )}

                {successMessage && (
                    <Alert severity="success">
                        {successMessage}
                    </Alert>
                )}

                {sortedQuestions.map((question) => (
                    <QuestionInput
                        key={question.id}
                        question={question}
                        answer={
                            answers[question.id] ??
                            createEmptyAnswer(question.id)
                        }
                        updateAnswer={updateAnswer}
                        toggleMatrixCell={toggleMatrixCell}
                    />
                ))}

                {/* Gönderim / Test Butonları */}
                {form.status === "Closed" ? (
                    <Alert severity="info">
                        Anket kapatıldığı için yeni yanıt kabul edilmemektedir.
                    </Alert>
                ) : isPreviewMode ? (
                    <Button
                        variant="contained"
                        color="info"
                        size="large"
                        onClick={handleTestSubmitPreview}
                        startIcon={<VisibilityIcon />}
                    >
                        Test Yanıtını Gönder (Önizleme)
                    </Button>
                ) : !hasSubmitted ? (
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Gönderiliyor..."
                            : "Yanıtları Gönder"}
                    </Button>
                ) : null}

                {hasSubmitted && !isSubmissionCompleted && !isPreviewMode && (
                    <Alert severity="info">
                        Bu ankete daha önce yanıt verdiniz.
                    </Alert>
                )}

            </Stack>

            <Snackbar
                open={isCopySnackbarOpen}
                autoHideDuration={3500}
                onClose={() => setIsCopySnackbarOpen(false)}
                message="Katılımcı anket bağlantısı panoya kopyalandı!"
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
            </Container>
        </>
    );
}

interface QuestionInputProps {
    question: PublishedQuestion;
    answer: SubmitAnswerRequest;
    updateAnswer: (
        questionId: number,
        changes: Partial<SubmitAnswerRequest>,
    ) => void;
    toggleMatrixCell: (
        question: PublishedQuestion,
        cell: SubmitMatrixCellRequest,
    ) => void;
}

function QuestionInput({
                           question,
                           answer,
                           updateAnswer,
                           toggleMatrixCell,
                       }: QuestionInputProps) {
    const [dynamicOptions, setDynamicOptions] = useState<PublishedTextItem[]>(question.options);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (question.options.length === 0 && question.optionSourceType === "Api" && question.optionSourceUrl) {
            previewOptionsFromUrl({
                url: question.optionSourceUrl,
                jsonPath: question.optionJsonPath ?? "",
                textProperty: question.optionTextProperty ?? "text",
            })
                .then((res) => {
                    if (isMounted && res.isSuccess && res.data) {
                        setDynamicOptions(
                            res.data.options.map((text, idx) => ({
                                id: idx + 1,
                                text,
                                displayOrder: idx + 1,
                            })),
                        );
                    }
                })
                .catch(() => {})
                .finally(() => {
                    if (isMounted) {
                        setIsLoadingOptions(false);
                    }
                });
        }
        return () => {
            isMounted = false;
        };
    }, [question.options.length, question.optionSourceType, question.optionSourceUrl, question.optionJsonPath, question.optionTextProperty]);

    const effectiveOptions = dynamicOptions.length > 0 ? dynamicOptions : question.options;

    const renderQuestionInput = () => {
        if (isLoadingOptions) {
            return <CircularProgress size={24} sx={{ my: 1 }} />;
        }

        switch (question.type) {
            case "ShortText":
                return (
                    <TextField
                        fullWidth
                        value={answer.textValue ?? ""}
                        onChange={(event) =>
                            updateAnswer(question.id, {
                                textValue: event.target.value,
                            })
                        }
                    />
                );

            case "LongText":
                return (
                    <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        value={answer.textValue ?? ""}
                        onChange={(event) =>
                            updateAnswer(question.id, {
                                textValue: event.target.value,
                            })
                        }
                    />
                );

            case "Date":
                return (
                    <TextField
                        fullWidth
                        type="date"
                        value={answer.dateValue ?? ""}
                        onChange={(event) =>
                            updateAnswer(question.id, {
                                dateValue:
                                    event.target.value || null,
                            })
                        }
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                    />
                );

            case "Rating": {
                const minValue =
                    question.validation?.minValue ?? 1;
                const maxValue =
                    question.validation?.maxValue ?? 5;

                const values = Array.from(
                    {
                        length: maxValue - minValue + 1,
                    },
                    (_, index) => minValue + index,
                );

                return (
                    <RadioGroup
                        row
                        value={
                            answer.numericValue?.toString() ?? ""
                        }
                        onChange={(event) =>
                            updateAnswer(question.id, {
                                numericValue: Number(
                                    event.target.value,
                                ),
                            })
                        }
                    >
                        {values.map((value) => (
                            <FormControlLabel
                                key={value}
                                value={value}
                                control={<Radio />}
                                label={value}
                            />
                        ))}
                    </RadioGroup>
                );
            }

            case "SingleChoice":
                return (
                    <RadioGroup
                        value={
                            answer.selectedOptionIds[0]?.toString() ??
                            ""
                        }
                        onChange={(event) => {
                            const selectedId = Number(event.target.value);
                            const opt = effectiveOptions.find((o) => o.id === selectedId);
                            updateAnswer(question.id, {
                                selectedOptionIds: [selectedId],
                                selectedOptionTexts: opt ? [opt.text] : [],
                                textValue: opt?.text ?? null,
                            });
                        }}
                    >
                        {effectiveOptions.map((option) => (
                            <FormControlLabel
                                key={option.id}
                                value={option.id}
                                control={<Radio />}
                                label={option.text}
                            />
                        ))}
                    </RadioGroup>
                );
            case "Dropdown": {
                const selectedOption =
                    effectiveOptions.find(
                        (option) =>
                            option.id ===
                            answer.selectedOptionIds[0],
                    ) ?? null;

                return (
                    <Autocomplete
                        fullWidth
                        options={effectiveOptions}
                        value={selectedOption}
                        getOptionLabel={(option) => option.text}
                        isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                        }
                        noOptionsText="Eşleşen seçenek bulunamadı"
                        onChange={(_, selectedValue) => {
                            updateAnswer(question.id, {
                                selectedOptionIds: selectedValue
                                    ? [selectedValue.id]
                                    : [],
                                selectedOptionTexts: selectedValue
                                    ? [selectedValue.text]
                                    : [],
                                textValue: selectedValue?.text ?? null,
                            });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Seçim yapınız"
                                placeholder="Aramak için yazın..."
                            />
                        )}
                    />
                );
            }

            case "MultipleChoice":
                return (
                    <FormGroup>
                        {effectiveOptions.map((option) => (
                            <FormControlLabel
                                key={option.id}
                                control={
                                    <Checkbox
                                        checked={answer.selectedOptionIds.includes(
                                            option.id,
                                        )}
                                        onChange={() => {
                                            const isSelected = answer.selectedOptionIds.includes(option.id);
                                            const newIds = isSelected
                                                ? answer.selectedOptionIds.filter((id) => id !== option.id)
                                                : [...answer.selectedOptionIds, option.id];
                                            const newTexts = effectiveOptions
                                                .filter((o) => newIds.includes(o.id))
                                                .map((o) => o.text);
                                            updateAnswer(question.id, {
                                                selectedOptionIds: newIds,
                                                selectedOptionTexts: newTexts,
                                            });
                                        }}
                                    />
                                }
                                label={option.text}
                            />
                        ))}
                    </FormGroup>
                );

            case "MultipleChoiceGrid":
            case "CheckboxGrid":
                return (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                {question.matrixColumns.map(
                                    (column) => (
                                        <TableCell
                                            key={column.id}
                                            align="center"
                                        >
                                            {column.text}
                                        </TableCell>
                                    ),
                                )}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {question.matrixRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        {row.text}
                                    </TableCell>

                                    {question.matrixColumns.map(
                                        (column) => {
                                            const isSelected =
                                                answer.matrixSelections.some(
                                                    (selection) =>
                                                        selection.matrixRowId ===
                                                        row.id &&
                                                        selection.matrixColumnId ===
                                                        column.id,
                                                );

                                            return (
                                                <TableCell
                                                    key={column.id}
                                                    align="center"
                                                >
                                                    {question.type ===
                                                    "MultipleChoiceGrid" ? (
                                                        <Radio
                                                            checked={
                                                                isSelected
                                                            }
                                                            onChange={() =>
                                                                toggleMatrixCell(
                                                                    question,
                                                                    {
                                                                        matrixRowId:
                                                                        row.id,
                                                                        matrixColumnId:
                                                                        column.id,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <Checkbox
                                                            checked={
                                                                isSelected
                                                            }
                                                            onChange={() =>
                                                                toggleMatrixCell(
                                                                    question,
                                                                    {
                                                                        matrixRowId:
                                                                        row.id,
                                                                        matrixColumnId:
                                                                        column.id,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </TableCell>
                                            );
                                        },
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                );

            default:
                return null;
        }
    };

    return (
        <Card>
            <CardContent>
                <Stack spacing={2}>
                    <Typography variant="h6">
                        {question.displayOrder}.{" "}
                        {question.title}
                        {question.isRequired && " *"}
                    </Typography>

                    <Divider />

                    {renderQuestionInput()}
                </Stack>
            </CardContent>
        </Card>
    );
}

export default PublishedFormPage;