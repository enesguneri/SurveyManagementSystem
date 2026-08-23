import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Container,
    Divider,
    FormControlLabel,
    FormGroup,
    Radio,
    RadioGroup,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import {
    getPublishedForm,
    submitFormResponse,
} from "../api/formApi";
import type {
    PublishedForm,
    PublishedQuestion,
} from "../types/publishedForm";
import type {
    SubmitAnswerRequest,
    SubmitFormResponseRequest,
    SubmitMatrixCellRequest,
} from "../types/response";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
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

    useEffect(() => {
        async function loadForm() {
            if (!publicId) {
                setErrorMessage("Form bağlantısı geçersiz.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await getPublishedForm(publicId);

                if (!response.isSuccess || !response.data) {
                    setErrorMessage(
                        response.message ?? "Form yüklenemedi.",
                    );
                    return;
                }

                setForm(response.data);

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
                    "Form yüklenirken sunucuya bağlanılamadı.",
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

    function toggleOption(
        questionId: number,
        optionId: number,
        isMultiple: boolean,
    ) {
        const currentAnswer =
            answers[questionId] ?? createEmptyAnswer(questionId);

        if (!isMultiple) {
            updateAnswer(questionId, {
                selectedOptionIds: [optionId],
            });
            return;
        }

        const isSelected =
            currentAnswer.selectedOptionIds.includes(optionId);

        const selectedOptionIds = isSelected
            ? currentAnswer.selectedOptionIds.filter(
                (id) => id !== optionId,
            )
            : [
                ...currentAnswer.selectedOptionIds,
                optionId,
            ];

        updateAnswer(questionId, { selectedOptionIds });
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
                .map(
                    (question) =>
                        answers[question.id] ??
                        createEmptyAnswer(question.id),
                ),
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
                    "Form gönderilemedi.",
                );
                return;
            }

            setSuccessMessage(
                "Form yanıtınız başarıyla gönderildi.",
            );
        } catch {
            setErrorMessage(
                "Yanıt gönderilirken sunucuya bağlanılamadı.",
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

                {form.accessType === "Authenticated" &&
                    form.showRespondentIdentity && (
                        <Alert severity="info">
                            Bu formu doldurduğunuzda adınız, form sahibinin
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
                        toggleOption={toggleOption}
                        toggleMatrixCell={toggleMatrixCell}
                    />
                ))}

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
            </Stack>
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
    toggleOption: (
        questionId: number,
        optionId: number,
        isMultiple: boolean,
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
                           toggleOption,
                           toggleMatrixCell,
                       }: QuestionInputProps) {
    const renderQuestionInput = () => {
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
                        onChange={(event) =>
                            toggleOption(
                                question.id,
                                Number(event.target.value),
                                false,
                            )
                        }
                    >
                        {question.options.map((option) => (
                            <FormControlLabel
                                key={option.id}
                                value={option.id}
                                control={<Radio />}
                                label={option.text}
                            />
                        ))}
                    </RadioGroup>
                );
            case "Dropdown":
                return (
                    <FormControl fullWidth>
                        <InputLabel id={`dropdown-label-${question.id}`}>
                            Seçim yapınız
                        </InputLabel>

                        <Select
                            labelId={`dropdown-label-${question.id}`}
                            label="Seçim yapınız"
                            value={
                                answer.selectedOptionIds[0]?.toString() ?? ""
                            }
                            onChange={(event) =>
                                toggleOption(
                                    question.id,
                                    Number(event.target.value),
                                    false,
                                )
                            }
                        >
                            {question.options.map((option) => (
                                <MenuItem
                                    key={option.id}
                                    value={option.id}
                                >
                                    {option.text}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );

            case "MultipleChoice":
                return (
                    <FormGroup>
                        {question.options.map((option) => (
                            <FormControlLabel
                                key={option.id}
                                control={
                                    <Checkbox
                                        checked={answer.selectedOptionIds.includes(
                                            option.id,
                                        )}
                                        onChange={() =>
                                            toggleOption(
                                                question.id,
                                                option.id,
                                                true,
                                            )
                                        }
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