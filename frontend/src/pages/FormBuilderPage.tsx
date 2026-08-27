import { useEffect, useState } from "react";
import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    FormHelperText,
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
    getManageableForm,
    publishForm,
    updateDraftForm,
} from "../api/formApi";
import type { ReactNode } from "react";
import {
    ArrowDropDown,
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
import { getAvailableRoles } from "../api/roleApi";
import type { Role } from "../types/role";
import type { ManageableFormDetails } from "../types/manageableForm";
import type { CreateFormRequest } from "../types/formApi";

import { useAuth } from "../auth/useAuth";
import BrandHeader from "../components/layout/BrandHeader";
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
        value: "Dropdown",
        label: "Açılır menü",
        icon: <ArrowDropDown />,
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

function mapManageableFormToDraft(
    form: ManageableFormDetails,
): FormDraft {
    return {
        title: form.title,
        description: form.description ?? "",
        accessType: form.accessType,
        showRespondentIdentity:
        form.showRespondentIdentity,
        roleIds: form.roleIds,

        questions: form.questions.map((question) => ({
            clientId: crypto.randomUUID(),
            title: question.title,
            type: question.type,
            isRequired: question.isRequired,
            options: question.options
                .sort(
                    (first, second) =>
                        first.displayOrder -
                        second.displayOrder,
                )
                .map((option) => option.text),
            matrixRows: question.matrixRows
                .sort(
                    (first, second) =>
                        first.displayOrder -
                        second.displayOrder,
                )
                .map((row) => row.text),
            matrixColumns: question.matrixColumns
                .sort(
                    (first, second) =>
                        first.displayOrder -
                        second.displayOrder,
                )
                .map((column) => column.text),
            validation: {
                minLength:
                    question.validation?.minLength ?? null,
                maxLength:
                    question.validation?.maxLength ?? null,
                regexPattern:
                    question.validation?.regexPattern ?? "",
                minValue:
                    question.validation?.minValue ?? null,
                maxValue:
                    question.validation?.maxValue ?? null,
                minDate:
                    question.validation?.minDate ?? null,
                maxDate:
                    question.validation?.maxDate ?? null,
            },
        })),
    };
}

function mapAiDraftToFormDraft(
    aiDraft: CreateFormRequest,
): FormDraft {
    return {
        title: aiDraft.title,
        description: aiDraft.description ?? "",
        accessType: aiDraft.accessType,
        showRespondentIdentity:
        aiDraft.showRespondentIdentity,
        roleIds: aiDraft.roleIds,

        questions: aiDraft.questions.map((question) => ({
            clientId: crypto.randomUUID(),
            title: question.title,
            type: question.type,
            isRequired: question.isRequired,

            options: question.options.map(
                (option) => option.text,
            ),

            matrixRows: question.matrixRows.map(
                (row) => row.text,
            ),

            matrixColumns: question.matrixColumns.map(
                (column) => column.text,
            ),

            validation: {
                minLength:
                    question.validation?.minLength ?? null,
                maxLength:
                    question.validation?.maxLength ?? null,
                regexPattern:
                    question.validation?.regexPattern ?? "",
                minValue:
                    question.validation?.minValue ?? null,
                maxValue:
                    question.validation?.maxValue ?? null,
                minDate:
                    question.validation?.minDate ?? null,
                maxDate:
                    question.validation?.maxDate ?? null,
            },
        })),
    };
}

export default function FormBuilderPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const locationState = location.state as {
        aiDraft?: CreateFormRequest;
    } | null;

    const initialAiDraft = locationState?.aiDraft;
    const { logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const { publicId } = useParams<{
        publicId?: string;
    }>();

    const isEditMode = Boolean(publicId);

    const [formDraft, setFormDraft] =
        useState<FormDraft>(() =>
            initialAiDraft
                ? mapAiDraftToFormDraft(initialAiDraft)
                : {
                    title: "",
                    description: "",
                    accessType: "Authenticated",
                    showRespondentIdentity: false,
                    roleIds: [],
                    questions: [createEmptyQuestion()],
                },
        );

    const [isLoadingForm, setIsLoadingForm] =
        useState(isEditMode);

    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [createdForm, setCreatedForm] =
        useState<FormCreatedResponse | null>(null);

    const [isPublishing, setIsPublishing] = useState(false);

    const [availableRoles, setAvailableRoles] =
        useState<Role[]>([]);

    const [rolesError, setRolesError] = useState("");

    useEffect(() => {
        async function loadAvailableRoles() {
            try {
                const response = await getAvailableRoles();

                if (!response.isSuccess || !response.data) {
                    setRolesError(
                        response.message ??
                        "Birim rolleri yüklenemedi.",
                    );
                    return;
                }

                setAvailableRoles(response.data);
            } catch {
                setRolesError(
                    "Birim rolleri alınırken API bağlantısı kurulamadı.",
                );
            }
        }

        void loadAvailableRoles();
    }, []);

    useEffect(() => {
        if (!publicId) {
            return;
        }

        const formPublicId = publicId;

        async function loadManageableForm() {
            try {
                const response = await getManageableForm(
                    formPublicId,
                );

                if (!response.isSuccess || !response.data) {
                    setErrorMessage(
                        response.errors?.join(" ") ??
                        response.message ??
                        "Anket detayları yüklenemedi.",
                    );
                    return;
                }

                setFormDraft(
                    mapManageableFormToDraft(response.data),
                );
            } catch {
                setErrorMessage(
                    "Anket detayları yüklenirken API bağlantısı kurulamadı.",
                );
            } finally {
                setIsLoadingForm(false);
            }
        }

        void loadManageableForm();
    }, [publicId]);

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

            // Public formlarda yanıtlayan kimliği ayarı kullanılmaz.
            showRespondentIdentity:
                value === "Authenticated"
                    ? currentDraft.showRespondentIdentity
                    : false,
        }));
    }

    async function handleSave() {
        setErrorMessage("");

        if (!formDraft.title.trim()) {
            setErrorMessage("Anket başlığı zorunludur.");
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
            const result = publicId
                ? await updateDraftForm(
                    publicId,
                    formDraft,
                )
                : await createForm(formDraft);

            if (!result.isSuccess) {
                setErrorMessage(
                    result.errors?.join(" ") ||
                    result.message ||
                    "Anket oluşturulamadı.",
                );
                return;
            }

            if (result.data) {
                setCreatedForm(result.data);
            }
        } catch {
            setErrorMessage(
                "Anket oluşturulurken API bağlantısı kurulamadı.",
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
                    "Anket yayınlanamadı.",
                );
                return;
            }

            setCreatedForm(result.data);
        } catch {
            setErrorMessage(
                "Anket yayınlanırken API bağlantısı kurulamadı.",
            );
        } finally {
            setIsPublishing(false);
        }
    }

    if (isLoadingForm) {
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

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
                py: 0,
            }}
        >
            <BrandHeader pageTitle={isEditMode ? "Taslak Anketi Düzenle" : "Yeni Anket"} onHome={() => navigate("/")} onLogout={handleLogout} />
            <Container maxWidth="md" sx={{ py: 5 }}>
                <Stack spacing={3}>
                    <Stack
                        direction="row"
                        sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                            {isEditMode
                                ? "Taslak Anketi Düzenle"
                                : "Yeni Anket Oluştur"}
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

                                <FormControl
                                    fullWidth
                                >
                                    <InputLabel id="form-roles-label">
                                        Anketin ait olduğu birimler
                                    </InputLabel>

                                    <Select
                                        labelId="form-roles-label"
                                        multiple
                                        value={formDraft.roleIds}
                                        label="Anketin ait olduğu birimler"
                                        renderValue={(selected) =>
                                            availableRoles
                                                .filter((role) =>
                                                    (selected as number[]).includes(role.id),
                                                )
                                                .map((role) => role.name)
                                                .join(", ")
                                        }
                                        onChange={(event) => {
                                            const value = event.target.value;

                                            const roleIds =
                                                typeof value === "string"
                                                    ? value.split(",").map(Number)
                                                    : value.map(Number);

                                            setFormDraft((currentDraft) => ({
                                                ...currentDraft,
                                                roleIds,
                                            }));
                                        }}
                                    >
                                        {availableRoles.map((role) => (
                                            <MenuItem
                                                key={role.id}
                                                value={role.id}
                                            >
                                                <Checkbox
                                                    checked={formDraft.roleIds.includes(
                                                        role.id,
                                                    )}
                                                />

                                                <ListItemText primary={role.name} />
                                            </MenuItem>
                                        ))}
                                    </Select>

                                    <FormHelperText>
                                        {rolesError ||
                                            "Anketi belirli bir birime bağlamak istemiyorsanız boş bırakabilirsiniz."}
                                    </FormHelperText>
                                </FormControl>

                                {formDraft.accessType === "Authenticated" && (
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formDraft.showRespondentIdentity}
                                                onChange={(event) =>
                                                    setFormDraft((currentDraft) => ({
                                                        ...currentDraft,
                                                        showRespondentIdentity:
                                                        event.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Yanıtlayanların adı sonuçlarda gösterilsin"
                                    />
                                )}

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
                                        {isEditMode
                                            ? "Taslak anket başarıyla güncellendi."
                                            : "Taslak anket başarıyla oluşturuldu."}
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
                                                    : "Anketi Yayınla"}
                                        </Button>

                                        {createdForm.status === "Published" && (
                                            <Button
                                                variant="outlined"
                                                onClick={() =>
                                                    navigate(
                                                        `/forms/${createdForm.publicId}`,
                                                    )
                                                }
                                            >
                                                Anketi Görüntüle
                                            </Button>
                                        )}

                                        <Button
                                            variant="text"
                                            onClick={() => navigate("/")}
                                        >
                                             Ana Sayfa'ya Dön
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
                        disabled={
                            isSaving ||
                            (!isEditMode && Boolean(createdForm)) ||
                            !formDraft.title.trim()
                        }
                    >
                        {isSaving ? "Kaydediliyor..." : "Anketi Kaydet"}
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
}