import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    CircularProgress,
    Container,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import BrandHeader from "../components/layout/BrandHeader";
import { useAuth } from "../auth/useAuth";
import { generateSurveyDraft } from "../api/aiApi";
import type {
    AiConversationMessage,
    GenerateSurveyDraftResponse,
} from "../types/ai";

function getQuestionTypeLabel(type: string) {
    const labels: Record<string, string> = {
        ShortText: "Kısa yanıt",
        LongText: "Paragraf",
        SingleChoice: "Çoktan seçmeli",
        Dropdown: "Açılır menü",
        MultipleChoice: "Onay kutuları",
        Rating: "Derecelendirme",
        MultipleChoiceGrid: "Çoktan seçmeli tablosu",
        CheckboxGrid: "Onay kutusu tablosu",
        Date: "Tarih",
    };

    return labels[type] ?? type;
}

export default function AiSurveyAssistantPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [prompt, setPrompt] = useState("");
    const [conversation, setConversation] = useState<
        AiConversationMessage[]
    >([]);
    const [result, setResult] =
        useState<GenerateSurveyDraftResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    function handleLogout() {
        logout();
        navigate("/login");
    }

    async function handleGenerate() {
        const trimmedPrompt = prompt.trim();

        if (trimmedPrompt.length < 10) {
            setErrorMessage(
                "Lütfen en az 10 karakterlik bir açıklama girin.",
            );
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await generateSurveyDraft({
                prompt: trimmedPrompt,
                conversation,
            });

            if (
                !response.isSuccess ||
                !response.data
            ) {
                setErrorMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "AI taslağı oluşturulamadı.",
                );
                return;
            }

            const aiResult = response.data;

            setResult(aiResult);

            // Stateless backend kullandığımız için konuşma
            // geçmişi frontend tarafından tekrar gönderilir.
            setConversation((currentConversation) => [
                ...currentConversation,
                {
                    role: "user",
                    content: trimmedPrompt,
                },
                {
                    role: "assistant",
                    content: aiResult.message,
                },
            ]);

            setPrompt("");
        } catch (error) {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 502
            ) {
                setErrorMessage(
                    "Gemini servisi şu anda yanıt veremiyor.",
                );
            } else {
                setErrorMessage(
                    "AI servisine bağlanırken bir hata oluştu.",
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleUseDraft() {
        if (!result?.draft) {
            return;
        }

        navigate("/forms/new", {
            state: {
                aiDraft: result.draft,
            },
        });
    }

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <BrandHeader
                pageTitle="AI ile Anket Oluştur"
                onHome={() => navigate("/")}
                onLogout={handleLogout}
            />

            <Container maxWidth="md" sx={{ py: 5 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ fontWeight: 800 }}
                        >
                            AI ile Anket Oluştur
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            Nasıl bir anket istediğinizi açıklayın.
                            Eksik bilgiler varsa AI size sorular
                            soracaktır.
                        </Typography>
                    </Box>

                    {errorMessage && (
                        <Alert severity="error">
                            {errorMessage}
                        </Alert>
                    )}

                    <Paper sx={{ p: 3 }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Anket açıklaması"
                                placeholder="Örneğin: Üniversite öğrencilerinin bilgi işlem hizmetlerinden memnuniyetini ölçen, 10 soruluk bir anket oluştur."
                                value={prompt}
                                onChange={(event) =>
                                    setPrompt(event.target.value)
                                }
                                multiline
                                minRows={5}
                                fullWidth
                                helperText="En az 10 karakter girin."
                            />

                            <Button
                                variant="contained"
                                onClick={handleGenerate}
                                disabled={
                                    isSubmitting ||
                                    prompt.trim().length < 10
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <CircularProgress
                                            size={20}
                                            color="inherit"
                                            sx={{ mr: 1 }}
                                        />
                                        Oluşturuluyor...
                                    </>
                                ) : (
                                    "Anket Taslağı Oluştur"
                                )}
                            </Button>
                        </Stack>
                    </Paper>

                    {conversation.length > 0 && (
                        <Paper sx={{ p: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 700, mb: 2 }}
                            >
                                Görüşme
                            </Typography>

                            <Stack spacing={1.5}>
                                {conversation.map(
                                    (message, index) => (
                                        <Box
                                            key={`${message.role}-${index}`}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                backgroundColor:
                                                    message.role ===
                                                    "user"
                                                        ? "rgba(0, 124, 131, 0.08)"
                                                        : "rgba(224, 138, 93, 0.10)",
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {message.role ===
                                                "user"
                                                    ? "Siz"
                                                    : "AI"}
                                            </Typography>

                                            <Typography sx={{ mt: 0.5 }}>
                                                {message.content}
                                            </Typography>
                                        </Box>
                                    ),
                                )}
                            </Stack>
                        </Paper>
                    )}

                    {result?.status ===
                        "NeedsClarification" && (
                            <Alert severity="warning">
                                <Typography
                                    sx={{ fontWeight: 700 }}
                                >
                                    Ek bilgi gerekiyor
                                </Typography>

                                <Box
                                    component="ul"
                                    sx={{ mb: 0 }}
                                >
                                    {result.clarifyingQuestions.map(
                                        (question) => (
                                            <li key={question}>
                                                {question}
                                            </li>
                                        ),
                                    )}
                                </Box>
                            </Alert>
                        )}

                    {result?.status === "Ready" &&
                        result.draft && (
                            <Paper sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                    <Alert severity="success">
                                        Anket taslağı hazırlandı.
                                        Henüz veritabanına
                                        kaydedilmedi.
                                    </Alert>

                                    <Typography
                                        variant="h6"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Taslak önizlemesi
                                    </Typography>

                                    <Box>
                                        <Typography
                                            variant="h5"
                                            sx={{ fontWeight: 800 }}
                                        >
                                            {result.draft.title}
                                        </Typography>

                                        {result.draft.description && (
                                            <Typography
                                                color="text.secondary"
                                                sx={{ mt: 1 }}
                                            >
                                                {result.draft.description}
                                            </Typography>
                                        )}

                                        <Divider sx={{ my: 3 }} />

                                        <Stack spacing={2}>
                                            {result.draft.questions.map(
                                                (question, index) => (
                                                    <Paper
                                                        key={`${question.title}-${index}`}
                                                        variant="outlined"
                                                        sx={{ p: 2.5 }}
                                                    >
                                                        <Stack spacing={1.5}>
                                                            <Stack
                                                                direction={{
                                                                    xs: "column",
                                                                    sm: "row",
                                                                }}
                                                                spacing={1}
                                                                sx={{
                                                                    alignItems: {
                                                                        sm: "center",
                                                                    },
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="h6"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                        flexGrow: 1,
                                                                    }}
                                                                >
                                                                    {index + 1}.{" "}
                                                                    {question.title}
                                                                </Typography>

                                                                <Chip
                                                                    size="small"
                                                                    label={getQuestionTypeLabel(
                                                                        question.type,
                                                                    )}
                                                                />

                                                                {question.isRequired && (
                                                                    <Chip
                                                                        size="small"
                                                                        color="error"
                                                                        label="Zorunlu"
                                                                    />
                                                                )}
                                                            </Stack>

                                                            {question.description && (
                                                                <Typography
                                                                    color="text.secondary"
                                                                >
                                                                    {question.description}
                                                                </Typography>
                                                            )}

                                                            {question.options.length > 0 && (
                                                                <Box>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            mb: 0.5,
                                                                        }}
                                                                    >
                                                                        Seçenekler
                                                                    </Typography>

                                                                    {question.options.map(
                                                                        (option, optionIndex) => (
                                                                            <Typography
                                                                                key={`${option.text}-${optionIndex}`}
                                                                                variant="body2"
                                                                            >
                                                                                • {option.text}
                                                                            </Typography>
                                                                        ),
                                                                    )}
                                                                </Box>
                                                            )}

                                                            {question.matrixRows.length > 0 && (
                                                                <Typography variant="body2">
                                                                    <strong>Satırlar:</strong>{" "}
                                                                    {question.matrixRows
                                                                        .map((row) => row.text)
                                                                        .join(", ")}
                                                                </Typography>
                                                            )}

                                                            {question.matrixColumns.length > 0 && (
                                                                <Typography variant="body2">
                                                                    <strong>Sütunlar:</strong>{" "}
                                                                    {question.matrixColumns
                                                                        .map((column) => column.text)
                                                                        .join(", ")}
                                                                </Typography>
                                                            )}

                                                            {question.validation && (
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                >
                                                                    Doğrulama:{" "}
                                                                    {question.validation
                                                                            .minValue !== null &&
                                                                        `Min: ${question.validation.minValue} `}
                                                                    {question.validation
                                                                            .maxValue !== null &&
                                                                        `Max: ${question.validation.maxValue} `}
                                                                    {question.validation
                                                                            .minDate &&
                                                                        `Başlangıç: ${question.validation.minDate} `}
                                                                    {question.validation
                                                                            .maxDate &&
                                                                        `Bitiş: ${question.validation.maxDate}`}
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </Paper>
                                                ),
                                            )}
                                        </Stack>

                                        <Button
                                            variant="contained"
                                            onClick={handleUseDraft}
                                            sx={{ mt: 3 }}
                                        >
                                            Taslağı Form Oluşturma Ekranına Aktar
                                        </Button>
                                    </Box>
                                </Stack>
                            </Paper>
                        )}
                </Stack>
            </Container>
        </Box>
    );
}