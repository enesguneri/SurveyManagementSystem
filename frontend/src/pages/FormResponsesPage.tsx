import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Divider,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import ListAltIcon from "@mui/icons-material/ListAlt";
import {
    downloadFormResponses,
    getFormResponses,
} from "../api/formApi";
import type {
    FormResponseItem,
    FormResponses,
    ResponseAnswerDetails,
} from "../types/response";
import { useAuth } from "../auth/useAuth";
import BrandHeader from "../components/layout/BrandHeader";
import { aggregateQuestionAnalytics } from "../utils/chartAnalytics";
import QuestionSummaryCard from "../components/charts/QuestionSummaryCard";

function ResponseAnswer({
    answer,
}: {
    answer: ResponseAnswerDetails;
}) {
    return (
        <Stack spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>
                {answer.questionTitle}
            </Typography>

            {answer.textValue && (
                <Typography>
                    {answer.textValue}
                </Typography>
            )}

            {answer.numericValue !== null && (
                <Typography>
                    Puan: {answer.numericValue}
                </Typography>
            )}

            {answer.dateValue && (
                <Typography>
                    Tarih: {answer.dateValue}
                </Typography>
            )}

            {answer.selectedOptions.length > 0 && (
                <Stack spacing={0.5}>
                    {answer.selectedOptions.map((option) => (
                        <Typography key={option.id}>
                            • {option.text}
                        </Typography>
                    ))}
                </Stack>
            )}

            {answer.matrixSelections.length > 0 && (
                <Stack spacing={0.5}>
                    {answer.matrixSelections.map((selection) => (
                        <Typography
                            key={`${selection.matrixRowId}-${selection.matrixColumnId}`}
                        >
                            • {selection.matrixRowText}:{" "}
                            {selection.matrixColumnText}
                        </Typography>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

function ResponseCard({
    response,
    showRespondentIdentity,
}: {
    response: FormResponseItem;
    showRespondentIdentity: boolean;
}) {
    return (
        <Card elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
                <Stack spacing={2}>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 700 }}
                        >
                            {showRespondentIdentity &&
                            response.respondentName
                                ? response.respondentName
                                : "Anonim yanıt"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Gönderilme zamanı:{" "}
                            {new Date(
                                response.submittedAt,
                            ).toLocaleString("tr-TR")}
                        </Typography>

                        {showRespondentIdentity &&
                            response.respondentEmail && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    E-posta: {response.respondentEmail}
                                </Typography>
                            )}

                        {showRespondentIdentity &&
                            response.respondentIpAddress && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    IP adresi: {response.respondentIpAddress}
                                </Typography>
                            )}
                    </Box>

                    <Divider />

                    {response.answers.map((answer) => (
                        <ResponseAnswer
                            key={answer.questionId}
                            answer={answer}
                        />
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}

export default function FormResponsesPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [activeTab, setActiveTab] = useState(0);

    function handleLogout() {
        logout();
        navigate("/login");
    }
    const { publicId } = useParams<{
        publicId?: string;
    }>();

    const [formResponses, setFormResponses] =
        useState<FormResponses | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const questionAnalytics = useMemo(() => {
        return aggregateQuestionAnalytics(formResponses?.responses ?? []);
    }, [formResponses]);

    async function handleExport(
        format: "csv" | "xlsx",
    ) {
        if (!publicId) {
            return;
        }

        setIsExporting(true);
        setExportError("");

        try {
            const file = await downloadFormResponses(
                publicId,
                format,
            );

            // Blob verisi tarayıcıda indirilebilir geçici URL'ye dönüştürülür.
            const downloadUrl =
                URL.createObjectURL(file);

            const link = document.createElement("a");
            const safeTitle = sanitizeFileName(
                formResponses?.title ?? "anket",
            );
            link.href = downloadUrl;
            link.download =
                `${safeTitle} Yanıtları.${format}`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 403
            ) {
                setExportError(
                    "Bu anketin yanıtlarını dışa aktarma yetkiniz yok.",
                );
            } else {
                setExportError(
                    "Yanıt dosyası oluşturulamadı.",
                );
            }
        } finally {
            setIsExporting(false);
        }
    }

    useEffect(() => {
        if (!publicId) return;

        async function loadResponses() {
            try {
                const response = await getFormResponses(
                    publicId as string,
                );

                if (!response.isSuccess || !response.data) {
                    setErrorMessage(
                        response.errors?.join(" ") ??
                        response.message ??
                        "Yanıtlar yüklenemedi.",
                    );
                    return;
                }

                setFormResponses(response.data);
            } catch (error) {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 403
                ) {
                    setErrorMessage(
                        "Bu anketin yanıtlarını görüntüleme yetkiniz yok.",
                    );
                    return;
                }

                setErrorMessage(
                    "Yanıtlar yüklenirken API bağlantısı kurulamadı.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadResponses();
    }, [publicId]);

    if (!publicId) {
        return (
            <Box sx={{ minHeight: "100vh" }}>
                <BrandHeader pageTitle="Yanıtlar" onHome={() => navigate("/")} />
                <Container maxWidth="md" sx={{ py: 5 }}>
                    <Alert severity="error">Anket kimliği bulunamadı.</Alert>
                </Container>
            </Box>
        );
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

    function sanitizeFileName(value: string) {
        return (
            value
                .replace(/[<>:"/\\|?*]/g, "_")
                .trim() || "anket"
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
            }}
        >
            <BrandHeader pageTitle="Yanıtlar" onHome={() => navigate("/")} onLogout={handleLogout} />

            <Container maxWidth="md" sx={{ py: 5 }}>
                <Stack spacing={3}>
                    {errorMessage && (
                        <Alert severity="error">
                            {errorMessage}
                        </Alert>
                    )}

                    {formResponses && (
                        <>
                            {/* 📌 Üst Bilgi ve Dışa Aktarma Butonları */}
                            <Box sx={{ p: { xs: 2.5, sm: 3 }, backgroundColor: "#ffffff", borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                                <Typography
                                    variant="h4"
                                    component="h1"
                                    sx={{ fontWeight: 800 }}
                                >
                                    {formResponses.title}
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    sx={{ mt: 1, fontWeight: 500 }}
                                >
                                    Toplam yanıt sayısı:{" "}
                                    <strong>{formResponses.responses.length}</strong>
                                </Typography>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                    sx={{ mt: 2.5 }}
                                >
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleExport("csv")}
                                        disabled={isExporting || formResponses.responses.length === 0}
                                    >
                                        {isExporting
                                            ? "Hazırlanıyor..."
                                            : "CSV İndir"}
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        onClick={() => handleExport("xlsx")}
                                        disabled={isExporting || formResponses.responses.length === 0}
                                    >
                                        {isExporting
                                            ? "Hazırlanıyor..."
                                            : "Excel İndir"}
                                    </Button>
                                </Stack>
                                {exportError && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {exportError}
                                    </Alert>
                                )}
                            </Box>

                            {formResponses.responses.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                    Bu ankete henüz yanıt gönderilmemiş.
                                </Alert>
                            ) : (
                                <>
                                    {/* 📑 Sekme Başlıkları: Özet Grafikler & Bireysel Yanıtlar */}
                                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                                        <Tabs
                                            value={activeTab}
                                            onChange={(_, val: number) => setActiveTab(val)}
                                            aria-label="Yanıt Görünümü Sekmeleri"
                                        >
                                            <Tab
                                                icon={<BarChartIcon />}
                                                iconPosition="start"
                                                label="Özet ve Grafikler"
                                                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.95rem" }}
                                            />
                                            <Tab
                                                icon={<ListAltIcon />}
                                                iconPosition="start"
                                                label={`Bireysel Yanıtlar (${formResponses.responses.length})`}
                                                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.95rem" }}
                                            />
                                        </Tabs>
                                    </Box>

                                    {/* 📊 Sekme 1: Özet Grafikler (Google Forms Tasarımı) */}
                                    {activeTab === 0 && (
                                        <Stack spacing={3}>
                                            {questionAnalytics.map((analytics) => (
                                                <QuestionSummaryCard
                                                    key={analytics.questionId}
                                                    analytics={analytics}
                                                    totalFormResponses={formResponses.responses.length}
                                                />
                                            ))}
                                        </Stack>
                                    )}

                                    {/* 📋 Sekme 2: Bireysel Yanıtlar */}
                                    {activeTab === 1 && (
                                        <Stack spacing={3}>
                                            {formResponses.responses.map((response) => (
                                                <ResponseCard
                                                    key={response.id}
                                                    response={response}
                                                    showRespondentIdentity={
                                                        formResponses.showRespondentIdentity
                                                    }
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}