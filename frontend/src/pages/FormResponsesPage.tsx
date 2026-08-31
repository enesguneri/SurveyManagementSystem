import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    Snackbar,
    Stack,
    Tab,
    TablePagination,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import ListAltIcon from "@mui/icons-material/ListAlt";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import {
    deleteFormResponse,
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
import { extractErrorMessage } from "../utils/errorHandler";

/**
 * Kompakt ve modern tekil soru cevabı bileşeni
 */
function CompactResponseAnswer({
    answer,
}: {
    answer: ResponseAnswerDetails;
}) {
    return (
        <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mb: 0.25 }}>
                {answer.questionTitle}
            </Typography>

            {answer.textValue && (
                <Box
                    sx={{
                        p: 1,
                        borderRadius: 1.5,
                        backgroundColor: "rgba(0,0,0,0.03)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        fontSize: "0.875rem",
                        color: "text.secondary",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {answer.textValue}
                </Box>
            )}

            {answer.numericValue !== null && (
                <Chip
                    label={`Puan: ${answer.numericValue} / 10`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 24, fontSize: "0.75rem" }}
                />
            )}

            {answer.dateValue && (
                <Chip
                    label={`Tarih: ${answer.dateValue}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24, fontSize: "0.75rem" }}
                />
            )}

            {answer.selectedOptions.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                    {answer.selectedOptions.map((option) => (
                        <Chip
                            key={option.id}
                            label={option.text}
                            size="small"
                            sx={{
                                backgroundColor: "rgba(15, 118, 110, 0.08)",
                                color: "primary.dark",
                                fontWeight: 500,
                                height: 24,
                                fontSize: "0.75rem",
                            }}
                        />
                    ))}
                </Stack>
            )}

            {answer.matrixSelections.length > 0 && (
                <Stack spacing={0.25} sx={{ pl: 0.5 }}>
                    {answer.matrixSelections.map((selection) => (
                        <Typography
                            key={`${selection.matrixRowId}-${selection.matrixColumnId}`}
                            variant="caption"
                            color="text.secondary"
                        >
                            • <strong>{selection.matrixRowText}:</strong> {selection.matrixColumnText}
                        </Typography>
                    ))}
                </Stack>
            )}
        </Box>
    );
}

/**
 * Kompakt ve modern bireysel yanıt kartı
 */
function CompactResponseCard({
    response,
    showRespondentIdentity,
    onDelete,
    isDeleting,
}: {
    response: FormResponseItem;
    showRespondentIdentity: boolean;
    onDelete: (responseId: number) => void;
    isDeleting: boolean;
}) {
    const isAnonymous = !showRespondentIdentity || !response.respondentName;

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "#ffffff",
                transition: "all 0.2s ease",
                "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                },
            }}
        >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
                <Stack spacing={1.5}>
                    {/* Kart Üst Başlık ve Silme Butonu */}
                    <Stack
                        direction="row"
                        sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                            <Chip
                                icon={<PersonOutlineRoundedIcon fontSize="small" />}
                                label={isAnonymous ? "Anonim Katılımcı" : response.respondentName}
                                size="small"
                                color={isAnonymous ? "default" : "primary"}
                                variant={isAnonymous ? "outlined" : "filled"}
                                sx={{ fontWeight: 600, height: 26, fontSize: "0.8rem" }}
                            />

                            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                <AccessTimeRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(response.submittedAt).toLocaleString("tr-TR", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </Typography>
                            </Stack>

                            {showRespondentIdentity && response.respondentEmail && (
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                    <EmailOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {response.respondentEmail}
                                    </Typography>
                                </Stack>
                            )}

                            {showRespondentIdentity && response.respondentIpAddress && (
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                    <LanguageOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {response.respondentIpAddress}
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>

                        <Tooltip title="Bu yanıtı sil">
                            <span>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onDelete(response.id)}
                                    disabled={isDeleting}
                                    sx={{
                                        border: "1px solid rgba(211, 47, 47, 0.2)",
                                        "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.08)" },
                                    }}
                                >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>

                    <Divider sx={{ my: 0.5 }} />

                    {/* Soru Cevapları */}
                    <Stack spacing={1}>
                        {response.answers.map((answer) => (
                            <CompactResponseAnswer
                                key={answer.questionId}
                                answer={answer}
                            />
                        ))}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default function FormResponsesPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { publicId } = useParams<{ publicId?: string }>();

    const [formResponses, setFormResponses] = useState<FormResponses | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [activeTab, setActiveTab] = useState(0);

    // Sayfalama (Pagination) Durumları
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Silme Onay Dialog Durumları
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const questionAnalytics = useMemo(() => {
        return aggregateQuestionAnalytics(formResponses?.responses ?? []);
    }, [formResponses]);

    const paginatedResponses = useMemo(() => {
        if (!formResponses) return [];
        const startIndex = page * rowsPerPage;
        return formResponses.responses.slice(startIndex, startIndex + rowsPerPage);
    }, [formResponses, page, rowsPerPage]);

    async function handleExport(format: "csv" | "xlsx") {
        if (!publicId) return;

        setIsExporting(true);
        setExportError("");

        try {
            const file = await downloadFormResponses(publicId, format);
            const downloadUrl = URL.createObjectURL(file);
            const link = document.createElement("a");
            const safeTitle = sanitizeFileName(formResponses?.title ?? "anket");
            link.href = downloadUrl;
            link.download = `${safeTitle} Yanıtları.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            setExportError(extractErrorMessage(error, "Yanıt dosyası oluşturulamadı."));
        } finally {
            setIsExporting(false);
        }
    }

    async function handleConfirmDelete() {
        if (!publicId || deleteTargetId === null) return;

        setIsDeleting(true);
        try {
            const result = await deleteFormResponse(publicId, deleteTargetId);
            if (result.isSuccess) {
                setFormResponses((prev) => {
                    if (!prev) return null;
                    const updatedResponses = prev.responses.filter((r) => r.id !== deleteTargetId);
                    return {
                        ...prev,
                        responses: updatedResponses,
                    };
                });
                setSuccessMessage("Yanıt başarıyla silindi.");
                setDeleteTargetId(null);
            } else {
                setErrorMessage(result.message ?? "Yanıt silinemedi.");
            }
        } catch (error) {
            setErrorMessage(extractErrorMessage(error, "Yanıt silinirken bir hata oluştu."));
        } finally {
            setIsDeleting(false);
        }
    }

    useEffect(() => {
        if (!publicId) return;

        async function loadResponses() {
            try {
                const response = await getFormResponses(publicId as string);

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
                setErrorMessage(extractErrorMessage(error, "Yanıtlar yüklenirken API bağlantısı kurulamadı."));
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
            value.replace(/[<>:"/\\|?*]/g, "_").trim() || "anket"
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
                        <Alert severity="error" onClose={() => setErrorMessage("")}>
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
                                        {isExporting ? "Hazırlanıyor..." : "CSV İndir"}
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        onClick={() => handleExport("xlsx")}
                                        disabled={isExporting || formResponses.responses.length === 0}
                                    >
                                        {isExporting ? "Hazırlanıyor..." : "Excel İndir"}
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

                                    {/* 📋 Sekme 2: Bireysel Yanıtlar (Kompakt Kartlar ve Sayfalama) */}
                                    {activeTab === 1 && (
                                        <Stack spacing={2.5}>
                                            {/* Sayfalama Kontrolleri (Üst) */}
                                            {formResponses.responses.length > 10 && (
                                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                                    <TablePagination
                                                        component="div"
                                                        count={formResponses.responses.length}
                                                        page={page}
                                                        onPageChange={(_, newPage) => setPage(newPage)}
                                                        rowsPerPage={rowsPerPage}
                                                        onRowsPerPageChange={(e) => {
                                                            setRowsPerPage(parseInt(e.target.value, 10));
                                                            setPage(0);
                                                        }}
                                                        rowsPerPageOptions={[10, 20, 50, 100]}
                                                        labelRowsPerPage="Sayfa başına:"
                                                        labelDisplayedRows={({ from, to, count }) =>
                                                            `${from}–${to} / ${count !== -1 ? count : `+${to}`}`
                                                        }
                                                        sx={{ border: "none" }}
                                                    />
                                                </Box>
                                            )}

                                            {paginatedResponses.map((response) => (
                                                <CompactResponseCard
                                                    key={response.id}
                                                    response={response}
                                                    showRespondentIdentity={formResponses.showRespondentIdentity}
                                                    onDelete={(id) => setDeleteTargetId(id)}
                                                    isDeleting={isDeleting}
                                                />
                                            ))}

                                            {/* Sayfalama Kontrolleri (Alt) */}
                                            {formResponses.responses.length > 10 && (
                                                <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                                                    <TablePagination
                                                        component="div"
                                                        count={formResponses.responses.length}
                                                        page={page}
                                                        onPageChange={(_, newPage) => setPage(newPage)}
                                                        rowsPerPage={rowsPerPage}
                                                        onRowsPerPageChange={(e) => {
                                                            setRowsPerPage(parseInt(e.target.value, 10));
                                                            setPage(0);
                                                        }}
                                                        rowsPerPageOptions={[10, 20, 50, 100]}
                                                        labelRowsPerPage="Sayfa başına:"
                                                        labelDisplayedRows={({ from, to, count }) =>
                                                            `${from}–${to} / ${count !== -1 ? count : `+${to}`}`
                                                        }
                                                    />
                                                </Box>
                                            )}
                                        </Stack>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </Stack>
            </Container>

            {/* 🗑️ Yanıt Silme Onay Modalı */}
            <Dialog
                open={deleteTargetId !== null}
                onClose={() => !isDeleting && setDeleteTargetId(null)}
                aria-labelledby="delete-dialog-title"
            >
                <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 700 }}>
                    Yanıtı Silmek İstediğinize Emin Misiniz?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bu yanıt ve katılımcının verdiği tüm cevaplar kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteTargetId(null)} disabled={isDeleting}>
                        Vazgeç
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                        startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineRoundedIcon />}
                    >
                        {isDeleting ? "Siliniyor..." : "Evet, Yanıtı Sil"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Başarı Bildirimi */}
            <Snackbar
                open={Boolean(successMessage)}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage("")}
                message={successMessage}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Box>
    );
}