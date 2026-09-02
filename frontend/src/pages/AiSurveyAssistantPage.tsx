import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    Key as KeyIcon,
    Settings as SettingsIcon,
    Visibility,
    VisibilityOff,
    OpenInNew as OpenInNewIcon,
    CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import axios from "axios";
import BrandHeader from "../components/layout/BrandHeader";
import { useAuth } from "../auth/useAuth";
import { generateSurveyDraft } from "../api/aiApi";
import { getUserAiConfig, saveUserAiConfig } from "../api/aiConfigApi";
import { extractErrorMessage } from "../utils/errorHandler";
import type {
    AiConversationMessage,
    GenerateSurveyDraftResponse,
} from "../types/ai";
import type { UserAiConfig } from "../types/aiConfig";

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

    // AI Sohbet & Taslak Durumu
    const [prompt, setPrompt] = useState("");
    const [conversation, setConversation] = useState<AiConversationMessage[]>([]);
    const [result, setResult] = useState<GenerateSurveyDraftResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Kullanıcıya Özel Gemini API Yapılandırma Durumu
    const [aiConfig, setAiConfig] = useState<UserAiConfig | null>(null);
    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [modelInput, setModelInput] = useState("gemini-2.5-flash");
    const [showApiKey, setShowApiKey] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [configErrorMessage, setConfigErrorMessage] = useState("");
    const [configSuccessMessage, setConfigSuccessMessage] = useState("");

    function handleLogout() {
        logout();
        navigate("/login");
    }

    useEffect(() => {
        async function loadConfig() {
            setIsConfigLoading(true);
            try {
                const res = await getUserAiConfig();
                if (res.isSuccess && res.data) {
                    setAiConfig(res.data);
                    if (res.data.model) {
                        setModelInput(res.data.model);
                    }
                }
            } catch {
                // Config yüklenemezse null kalır
            } finally {
                setIsConfigLoading(false);
            }
        }

        void loadConfig();
    }, []);

    async function handleSaveConfig(closeModalAfter = false) {
        const trimmedKey = apiKeyInput.trim();
        if (!trimmedKey) {
            setConfigErrorMessage("Lütfen geçerli bir Gemini API anahtarı girin.");
            return;
        }

        setIsSavingConfig(true);
        setConfigErrorMessage("");
        setConfigSuccessMessage("");

        try {
            const res = await saveUserAiConfig({
                apiKey: trimmedKey,
                model: modelInput,
            });

            if (res.isSuccess) {
                setConfigSuccessMessage("Gemini API anahtarınız başarıyla kaydedildi.");
                const updated = await getUserAiConfig();
                if (updated.isSuccess && updated.data) {
                    setAiConfig(updated.data);
                }
                setApiKeyInput("");

                if (closeModalAfter) {
                    setTimeout(() => {
                        setIsConfigModalOpen(false);
                        setConfigSuccessMessage("");
                    }, 1200);
                }
            } else {
                setConfigErrorMessage(res.message || "Yapılandırma kaydedilemedi.");
            }
        } catch (error) {
            setConfigErrorMessage(
                extractErrorMessage(error, "Yapılandırma kaydedilirken bir hata oluştu.")
            );
        } finally {
            setIsSavingConfig(false);
        }
    }

    async function handleGenerate() {
        const trimmedPrompt = prompt.trim();

        if (trimmedPrompt.length < 10) {
            setErrorMessage("Lütfen en az 10 karakterlik bir açıklama girin.");
            return;
        }

        if (!aiConfig?.hasApiKey) {
            setErrorMessage("Lütfen önce kişisel Gemini API anahtarınızı yapılandırın.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await generateSurveyDraft({
                prompt: trimmedPrompt,
                conversation: conversation.slice(-20),
            });

            if (!response.isSuccess || !response.data) {
                setErrorMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "AI taslağı oluşturulamadı."
                );
                return;
            }

            const aiResult = response.data;
            setResult(aiResult);

            const assistantContent = [
                aiResult.message,
                ...aiResult.clarifyingQuestions.map((question) => `Soru: ${question}`),
            ]
                .filter(Boolean)
                .join("\n");

            setConversation((currentConversation) =>
                [
                    ...currentConversation,
                    {
                        role: "user" as const,
                        content: trimmedPrompt,
                    },
                    {
                        role: "assistant" as const,
                        content: assistantContent,
                    },
                ].slice(-20)
            );

            setPrompt("");
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 502) {
                setErrorMessage("Gemini servisi şu anda yanıt veremiyor veya API anahtarınız geçersiz.");
            } else {
                setErrorMessage(
                    extractErrorMessage(error, "AI servisine bağlanırken bir hata oluştu.")
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

    const hasApiKey = Boolean(aiConfig?.hasApiKey);

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

                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Nasıl bir anket istediğinizi açıklayın. Eksik bilgiler varsa AI size sorular soracaktır.
                        </Typography>
                    </Box>

                    {/* Gemini API Yapılandırma Durumu */}
                    {isConfigLoading ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="body2" color="text.secondary">
                                API yapılandırması kontrol ediliyor...
                            </Typography>
                        </Box>
                    ) : !hasApiKey ? (
                        <Card
                            variant="outlined"
                            sx={{
                                p: 2.5,
                                borderColor: "warning.main",
                                bgcolor: "warning.50",
                                borderRadius: 2,
                            }}
                        >
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                    <KeyIcon color="warning" sx={{ fontSize: 28 }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: "warning.dark" }}>
                                            Gemini API Yapılandırması Gerekli
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            AI ile anket oluşturabilmek için lütfen adınıza tanımlı bir Google Gemini API anahtarı kaydedin.
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Typography variant="body2" sx={{ color: "text.primary" }}>
                                    API anahtarınız yoksa Google AI Studio üzerinden tamamen ücretsiz olarak bir saniyede anahtar alabilirsiniz:
                                </Typography>

                                <Button
                                    variant="outlined"
                                    color="warning"
                                    size="small"
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<OpenInNewIcon />}
                                    sx={{ alignSelf: "flex-start" }}
                                >
                                    Google AI Studio'dan Ücretsiz API Anahtarı Al ↗
                                </Button>

                                <Divider />

                                {configErrorMessage && (
                                    <Alert severity="error">{configErrorMessage}</Alert>
                                )}
                                {configSuccessMessage && (
                                    <Alert severity="success">{configSuccessMessage}</Alert>
                                )}

                                <Stack spacing={2} sx={{ mt: 1 }}>
                                    <TextField
                                        label="Kişisel Gemini API Anahtarınız (x-goog-api-key)"
                                        placeholder="AIzaSy..."
                                        type={showApiKey ? "text" : "password"}
                                        value={apiKeyInput}
                                        onChange={(e) => setApiKeyInput(e.target.value)}
                                        fullWidth
                                        size="small"
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => setShowApiKey(!showApiKey)}
                                                            edge="end"
                                                            size="small"
                                                        >
                                                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />

                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        sx={{ alignItems: "center" }}
                                    >
                                        <TextField
                                            select
                                            label="Model Tercihi"
                                            value={modelInput}
                                            onChange={(e) => setModelInput(e.target.value)}
                                            size="small"
                                            sx={{ minWidth: 220 }}
                                        >
                                            <MenuItem value="gemini-2.5-flash">gemini-2.5-flash (Önerilen, Hızlı)</MenuItem>
                                            <MenuItem value="gemini-1.5-flash">gemini-1.5-flash</MenuItem>
                                            <MenuItem value="gemini-1.5-pro">gemini-1.5-pro (Kapsamlı)</MenuItem>
                                        </TextField>

                                        <Button
                                            variant="contained"
                                            color="warning"
                                            onClick={() => void handleSaveConfig(false)}
                                            disabled={isSavingConfig || !apiKeyInput.trim()}
                                            startIcon={
                                                isSavingConfig ? (
                                                    <CircularProgress size={18} color="inherit" />
                                                ) : (
                                                    <CheckCircleIcon />
                                                )
                                            }
                                        >
                                            {isSavingConfig ? "Kaydediliyor..." : "Anahtarı Kaydet ve Başla"}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Card>
                    ) : (
                        <Card
                            variant="outlined"
                            sx={{
                                p: 1.5,
                                px: 2,
                                borderColor: "success.light",
                                bgcolor: "success.50",
                                borderRadius: 2,
                            }}
                        >
                            <Stack
                                direction="row"
                                sx={{
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 1.5,
                                }}
                            >
                                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                    <CheckCircleIcon color="success" />
                                    <Box>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 700, color: "success.dark" }}
                                        >
                                            Kişisel Gemini API Yapılandırmanız Aktif
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: "center" }}>
                                            <Chip
                                                size="small"
                                                label={aiConfig?.maskedApiKey || "Anahtar Tanımlı"}
                                                variant="outlined"
                                                color="success"
                                            />
                                            <Chip
                                                size="small"
                                                label={aiConfig?.model || "gemini-2.5-flash"}
                                                variant="filled"
                                                color="default"
                                            />
                                        </Stack>
                                    </Box>
                                </Stack>

                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<SettingsIcon />}
                                    onClick={() => {
                                        setConfigErrorMessage("");
                                        setConfigSuccessMessage("");
                                        setApiKeyInput("");
                                        if (aiConfig?.model) {
                                            setModelInput(aiConfig.model);
                                        }
                                        setIsConfigModalOpen(true);
                                    }}
                                >
                                    Yapılandırmayı Güncelle
                                </Button>
                            </Stack>
                        </Card>
                    )}

                    {errorMessage && (
                        <Alert severity="error">{errorMessage}</Alert>
                    )}

                    <Paper sx={{ p: 3 }}>
                        <Stack spacing={2}>
                            <TextField
                                label="Anket açıklaması"
                                placeholder={
                                    hasApiKey
                                        ? "Örneğin: Üniversite öğrencilerinin bilgi işlem hizmetlerinden memnuniyetini ölçen, 10 soruluk bir anket oluştur."
                                        : "Anket oluşturabilmek için lütfen önce yukarıdaki alandan Gemini API anahtarınızı kaydedin."
                                }
                                value={prompt}
                                onChange={(event) => setPrompt(event.target.value)}
                                multiline
                                minRows={5}
                                fullWidth
                                disabled={!hasApiKey}
                                helperText={
                                    hasApiKey
                                        ? "En az 10 karakter girin."
                                        : "⚠️ Önce API anahtarı kaydedilmelidir."
                                }
                            />

                            <Button
                                variant="contained"
                                onClick={handleGenerate}
                                disabled={
                                    !hasApiKey ||
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
                                {conversation.map((message, index) => (
                                    <Box
                                        key={`${message.role}-${index}`}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor:
                                                message.role === "user"
                                                    ? "rgba(0, 124, 131, 0.08)"
                                                    : "rgba(224, 138, 93, 0.10)",
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {message.role === "user" ? "Siz" : "AI"}
                                        </Typography>

                                        <Typography sx={{ mt: 0.5 }}>
                                            {message.content}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    )}

                    {result?.status === "NeedsClarification" && (
                        <Alert severity="warning">
                            <Typography sx={{ fontWeight: 700 }}>
                                Ek bilgi gerekiyor
                            </Typography>

                            <Box component="ul" sx={{ mb: 0 }}>
                                {result.clarifyingQuestions.map((question) => (
                                    <li key={question}>{question}</li>
                                ))}
                            </Box>
                        </Alert>
                    )}

                    {result?.status === "Ready" && result.draft && (
                        <Paper sx={{ p: 3 }}>
                            <Stack spacing={2}>
                                <Alert severity="success">
                                    Anket taslağı hazırlandı. Henüz veritabanına kaydedilmedi.
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
                                            sx={{ mt: 0.5 }}
                                        >
                                            {result.draft.description}
                                        </Typography>
                                    )}
                                </Box>

                                <Divider />

                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 700 }}
                                >
                                    Sorular ({result.draft.questions.length})
                                </Typography>

                                <Stack spacing={2}>
                                    {result.draft.questions.map((question, index) => (
                                        <Paper
                                            key={index}
                                            variant="outlined"
                                            sx={{ p: 2 }}
                                        >
                                            <Stack spacing={1}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{ alignItems: "center" }}
                                                >
                                                    <Typography sx={{ fontWeight: 700 }}>
                                                        {index + 1}. {question.title}
                                                    </Typography>

                                                    {question.isRequired && (
                                                        <Chip
                                                            label="Zorunlu"
                                                            size="small"
                                                            color="error"
                                                        />
                                                    )}
                                                </Stack>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Tip: {getQuestionTypeLabel(question.type)}
                                                </Typography>

                                                {question.options && question.options.length > 0 && (
                                                    <Box component="ul" sx={{ mb: 0, pl: 2 }}>
                                                        {question.options.map((option, optIndex) => (
                                                            <li key={optIndex}>{option.text}</li>
                                                        ))}
                                                    </Box>
                                                )}

                                                {question.matrixRows && question.matrixRows.length > 0 && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                            Satırlar:
                                                        </Typography>
                                                        <Box component="ul" sx={{ mb: 0, pl: 2 }}>
                                                            {question.matrixRows.map((row, rowIndex) => (
                                                                <li key={rowIndex}>{row.text}</li>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}

                                                {question.matrixColumns && question.matrixColumns.length > 0 && (
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                            Sütunlar:
                                                        </Typography>
                                                        <Box component="ul" sx={{ mb: 0, pl: 2 }}>
                                                            {question.matrixColumns.map((col, colIndex) => (
                                                                <li key={colIndex}>{col.text}</li>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>

                                <Button
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    onClick={handleUseDraft}
                                    sx={{ alignSelf: "flex-start", mt: 2 }}
                                >
                                    Bu Taslağı Form Oluşturucuya Aktar
                                </Button>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Container>

            {/* Yapılandırma Güncelleme Modalı */}
            <Dialog
                open={isConfigModalOpen}
                onClose={() => !isSavingConfig && setIsConfigModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                    <SettingsIcon color="primary" />
                    Gemini API Yapılandırmasını Güncelle
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Mevcut API anahtarınızı değiştirebilir veya farklı bir model seçebilirsiniz.
                        </Typography>

                        {configErrorMessage && (
                            <Alert severity="error">{configErrorMessage}</Alert>
                        )}
                        {configSuccessMessage && (
                            <Alert severity="success">{configSuccessMessage}</Alert>
                        )}

                        <TextField
                            label="Yeni Gemini API Anahtarı"
                            placeholder={aiConfig?.maskedApiKey || "AIzaSy..."}
                            type={showApiKey ? "text" : "password"}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            fullWidth
                            size="small"
                            helperText="Değiştirmek istemiyorsanız mevcut anahtarı koruyabilirsiniz."
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                edge="end"
                                                size="small"
                                            >
                                                {showApiKey ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <TextField
                            select
                            label="Model Tercihi"
                            value={modelInput}
                            onChange={(e) => setModelInput(e.target.value)}
                            size="small"
                            fullWidth
                        >
                            <MenuItem value="gemini-2.5-flash">gemini-2.5-flash (Önerilen, Hızlı)</MenuItem>
                            <MenuItem value="gemini-1.5-flash">gemini-1.5-flash</MenuItem>
                            <MenuItem value="gemini-1.5-pro">gemini-1.5-pro (Kapsamlı)</MenuItem>
                        </TextField>

                        <Button
                            variant="text"
                            size="small"
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<OpenInNewIcon />}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            Google AI Studio'dan Anahtar Al ↗
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setIsConfigModalOpen(false)}
                        disabled={isSavingConfig}
                        color="inherit"
                    >
                        Vazgeç
                    </Button>
                    <Button
                        onClick={() => void handleSaveConfig(true)}
                        variant="contained"
                        disabled={isSavingConfig || !apiKeyInput.trim()}
                        startIcon={isSavingConfig ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                    >
                        {isSavingConfig ? "Kaydediliyor..." : "Güncellemeyi Kaydet"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
