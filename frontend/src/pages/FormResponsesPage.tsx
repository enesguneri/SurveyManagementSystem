import { useEffect, useState } from "react";
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
    Typography,
} from "@mui/material";
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
        <Card>
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
                            {new Date(
                                response.submittedAt,
                            ).toLocaleString("tr-TR")}
                        </Typography>
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
                            <Box>
                                <Typography
                                    variant="h4"
                                    component="h1"
                                >
                                    {formResponses.title}
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    Toplam yanıt:{" "}
                                    {formResponses.responses.length}
                                </Typography>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                    sx={{ mt: 2 }}
                                >
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleExport("csv")}
                                        disabled={isExporting}
                                    >
                                        {isExporting
                                            ? "Hazırlanıyor..."
                                            : "CSV indir"}
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        onClick={() => handleExport("xlsx")}
                                        disabled={isExporting}
                                    >
                                        {isExporting
                                            ? "Hazırlanıyor..."
                                            : "Excel indir"}
                                    </Button>
                                </Stack>
                                {exportError && (
                                    <Alert severity="error">
                                        {exportError}
                                    </Alert>
                                )}
                            </Box>

                            {formResponses.responses.length === 0 && (
                                <Alert severity="info">
                                    Bu ankete henüz yanıt gönderilmemiş.
                                </Alert>
                            )}

                            {formResponses.responses.map((response) => (
                                <ResponseCard
                                    key={response.id}
                                    response={response}
                                    showRespondentIdentity={
                                        formResponses.showRespondentIdentity
                                    }
                                />
                            ))}
                        </>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}