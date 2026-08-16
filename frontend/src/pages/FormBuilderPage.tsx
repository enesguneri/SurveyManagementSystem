import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
    createEmptyQuestion,
    type FormAccessType,
    type FormDraft,
    type QuestionType,
} from "../types/form";
import QuestionTypeEditor from "../components/forms/QuestionTypeEditor";
import { Alert } from "@mui/material";
import {
    createForm,
    publishForm,
} from "../api/formApi";
import type { ReactNode } from "react";
import {
    CalendarToday,
    CheckBox,
    GridOn,
    RadioButtonChecked,
    ShortText,
    StarBorder,
    Subject,
} from "@mui/icons-material";
import {
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import type { FormCreatedResponse } from "../types/formApi";

interface QuestionTypeOption {
    value: QuestionType;
    label: string;
    icon: ReactNode;
}

const questionTypeOptions: QuestionTypeOption[] = [
    {
        value: "ShortText",
        label: "Kısa yanıt",
        icon: <ShortText />,
    },
    {
        value: "LongText",
        label: "Paragraf",
        icon: <Subject />,
    },
    {
        value: "SingleChoice",
        label: "Çoktan seçmeli",
        icon: <RadioButtonChecked />,
    },
    {
        value: "MultipleChoice",
        label: "Onay kutuları",
        icon: <CheckBox />,
    },
    {
        value: "Rating",
        label: "Derecelendirme",
        icon: <StarBorder />,
    },
    {
        value: "MultipleChoiceGrid",
        label: "Çoktan seçmeli tablosu",
        icon: <GridOn />,
    },
    {
        value: "CheckboxGrid",
        label: "Onay kutusu tablosu",
        icon: <GridOn />,
    },
    {
        value: "Date",
        label: "Tarih",
        icon: <CalendarToday />,
    },
];

export default function FormBuilderPage() {
    const navigate = useNavigate();

    const [formDraft, setFormDraft] = useState<FormDraft>({
        title: "",
        description: "",
        accessType: "Authenticated",
        showRespondentIdentity: false,
        questions: [createEmptyQuestion()],
    });

    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [createdForm, setCreatedForm] =
        useState<FormCreatedResponse | null>(null);

    const [isPublishing, setIsPublishing] = useState(false);

    function updateQuestion(
        clientId: string,
        update: Partial<ReturnType<typeof createEmptyQuestion>>,
    ) {
        setFormDraft((currentDraft) => ({
            ...currentDraft,
            questions: currentDraft.questions.map((question) =>
                question.clientId === clientId
                    ? { ...question, ...update }
                    : question,
            ),
        }));
    }

    function addQuestion() {
        setFormDraft((currentDraft) => ({
            ...currentDraft,
            questions: [
                ...currentDraft.questions,
                createEmptyQuestion(),
            ],
        }));
    }

    function removeQuestion(clientId: string) {
        setFormDraft((currentDraft) => ({
            ...currentDraft,
            questions: currentDraft.questions.filter(
                (question) => question.clientId !== clientId,
            ),
        }));
    }

    function moveQuestion(clientId: string, direction: -1 | 1) {
        setFormDraft((currentDraft) => {
            const currentIndex = currentDraft.questions.findIndex(
                (question) => question.clientId === clientId,
            );

            const newIndex = currentIndex + direction;

            if (
                currentIndex < 0 ||
                newIndex < 0 ||
                newIndex >= currentDraft.questions.length
            ) {
                return currentDraft;
            }

            const questions = [...currentDraft.questions];
            const [movedQuestion] = questions.splice(currentIndex, 1);

            questions.splice(newIndex, 0, movedQuestion);

            return {
                ...currentDraft,
                questions,
            };
        });
    }

    function updateAccessType(value: FormAccessType) {
        setFormDraft((currentDraft) => ({
            ...currentDraft,
            accessType: value,
        }));
    }

    async function handleSave() {
        setErrorMessage("");

        if (!formDraft.title.trim()) {
            setErrorMessage("Form başlığı zorunludur.");
            return;
        }

        if (
            formDraft.questions.some(
                (question) => !question.title.trim(),
            )
        ) {
            setErrorMessage("Tüm soruların başlığı doldurulmalıdır.");
            return;
        }

        setIsSaving(true);

        try {
            const result = await createForm(formDraft);

            if (!result.isSuccess) {
                setErrorMessage(
                    result.errors?.join(" ") ||
                    result.message ||
                    "Form oluşturulamadı.",
                );
                return;
            }

            if (result.data) {
                setCreatedForm(result.data);
            }
        } catch {
            setErrorMessage(
                "Form oluşturulurken API bağlantısı kurulamadı.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handlePublish() {
        if (!createdForm) {
            return;
        }

        setErrorMessage("");
        setIsPublishing(true);

        try {
            const result = await publishForm(
                createdForm.publicId,
            );

            if (!result.isSuccess || !result.data) {
                setErrorMessage(
                    result.errors?.join(" ") ||
                    result.message ||
                    "Form yayınlanamadı.",
                );
                return;
            }

            setCreatedForm(result.data);
        } catch {
            setErrorMessage(
                "Form yayınlanırken API bağlantısı kurulamadı.",
            );
        } finally {
            setIsPublishing(false);
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
                py: 5,
            }}
        >
            <Container maxWidth="md">
                <Stack spacing={3}>
                    <Stack
                        direction="row"
                        sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                            Yeni Anket Oluştur
                        </Typography>

                        <Button
                            variant="outlined"
                            onClick={() => navigate("/")}
                        >
                            Vazgeç
                        </Button>
                    </Stack>

                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <TextField
                                    label="Anket başlığı"
                                    value={formDraft.title}
                                    onChange={(event) =>
                                        setFormDraft((currentDraft) => ({
                                            ...currentDraft,
                                            title: event.target.value,
                                        }))
                                    }
                                    required
                                />

                                <TextField
                                    label="Açıklama"
                                    value={formDraft.description}
                                    onChange={(event) =>
                                        setFormDraft((currentDraft) => ({
                                            ...currentDraft,
                                            description: event.target.value,
                                        }))
                                    }
                                    multiline
                                    minRows={3}
                                />

                                <FormControl fullWidth>
                                    <InputLabel id="access-type-label">
                                        Erişim tipi
                                    </InputLabel>

                                    <Select
                                        labelId="access-type-label"
                                        value={formDraft.accessType}
                                        label="Erişim tipi"
                                        onChange={(event) =>
                                            updateAccessType(
                                                event.target.value as FormAccessType,
                                            )
                                        }
                                    >
                                        <MenuItem value="Authenticated">
                                            Giriş yapan kullanıcılar
                                        </MenuItem>

                                        <MenuItem value="Public">
                                            Herkese açık
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formDraft.showRespondentIdentity}
                                            onChange={(event) =>
                                                setFormDraft((currentDraft) => ({
                                                    ...currentDraft,
                                                    showRespondentIdentity: event.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Yanıtlayanların adı sonuçlarda gösterilsin"
                                />

                            </Stack>
                        </CardContent>
                    </Card>

                    {formDraft.questions.map((question, index) => (
                        <Card key={question.clientId}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack
                                        direction="row"
                                        sx={{
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography variant="h6">
                                            {index + 1}. Soru
                                        </Typography>

                                        <Stack direction="row">
                                            <Button
                                                size="small"
                                                onClick={() =>
                                                    moveQuestion(question.clientId, -1)
                                                }
                                                disabled={index === 0}
                                            >
                                                <ArrowUpwardIcon fontSize="small" />
                                            </Button>

                                            <Button
                                                size="small"
                                                onClick={() =>
                                                    moveQuestion(question.clientId, 1)
                                                }
                                                disabled={
                                                    index === formDraft.questions.length - 1
                                                }
                                            >
                                                <ArrowDownwardIcon fontSize="small" />
                                            </Button>

                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                    removeQuestion(question.clientId)
                                                }
                                                disabled={formDraft.questions.length === 1}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </Button>
                                        </Stack>
                                    </Stack>

                                    <TextField
                                        label="Soru başlığı"
                                        value={question.title}
                                        onChange={(event) =>
                                            updateQuestion(question.clientId, {
                                                title: event.target.value,
                                            })
                                        }
                                        required
                                    />

                                    <FormControl fullWidth>
                                        <InputLabel id={`question-type-${question.clientId}`}>
                                            Soru tipi
                                        </InputLabel>

                                        <Select
                                            labelId={`question-type-${question.clientId}`}
                                            value={question.type}
                                            label="Soru tipi"
                                            renderValue={(selected) => {
                                                const selectedOption = questionTypeOptions.find(
                                                    (option) => option.value === selected,
                                                );

                                                return (
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        sx={{ alignItems: "center" }}
                                                    >
                                                        {selectedOption?.icon}
                                                        <span>{selectedOption?.label}</span>
                                                    </Stack>
                                                );
                                            }}
                                            onChange={(event) =>
                                                updateQuestion(question.clientId, {
                                                    type: event.target.value as QuestionType,
                                                })
                                            }
                                        >
                                            {questionTypeOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <ListItemIcon>{option.icon}</ListItemIcon>
                                                    <ListItemText primary={option.label} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={question.isRequired}
                                                onChange={(event) =>
                                                    updateQuestion(question.clientId, {
                                                        isRequired: event.target.checked,
                                                    })
                                                }
                                            />
                                        }
                                        label="Bu soru zorunlu olsun"
                                    />

                                    <QuestionTypeEditor
                                        question={question}
                                        onChange={(update) =>
                                            updateQuestion(question.clientId, update)
                                        }
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}

                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addQuestion}
                    >
                        Soru Ekle
                    </Button>

                    {createdForm && (
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Alert severity="success">
                                        Taslak form başarıyla oluşturuldu.
                                    </Alert>

                                    <Typography>
                                        PublicId: {createdForm.publicId}
                                    </Typography>

                                    <Typography>
                                        Durum: {createdForm.status}
                                    </Typography>

                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                    >
                                        <Button
                                            variant="contained"
                                            onClick={handlePublish}
                                            disabled={
                                                isPublishing ||
                                                createdForm.status === "Published"
                                            }
                                        >
                                            {isPublishing
                                                ? "Yayınlanıyor..."
                                                : createdForm.status === "Published"
                                                    ? "Yayınlandı"
                                                    : "Formu Yayınla"}
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            onClick={() =>
                                                navigate(
                                                    `/forms/${createdForm.publicId}`,
                                                )
                                            }
                                        >
                                            Formu Görüntüle
                                        </Button>

                                        <Button
                                            variant="text"
                                            onClick={() => navigate("/")}
                                        >
                                            Dashboard'a Dön
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {errorMessage && (
                        <Alert severity="error">{errorMessage}</Alert>
                    )}

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSave}
                        disabled={isSaving || Boolean(createdForm) || !formDraft.title.trim()}
                    >
                        {isSaving ? "Kaydediliyor..." : "Formu Kaydet"}
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
}