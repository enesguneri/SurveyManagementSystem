import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
    FormControl,
    MenuItem,
    Pagination,
    Select,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PublishIcon from "@mui/icons-material/Publish";
import ReplayIcon from "@mui/icons-material/Replay";
import {
    closeForm,
    deleteForm,
    getManageableForms,
    publishForm,
    reopenForm,
} from "../api/formApi";
import type { ManageableForm } from "../types/manageableForm";
import { useAuth } from "../auth/useAuth";
import BrandHeader from "../components/layout/BrandHeader";
import { extractErrorMessage } from "../utils/errorHandler";

function getStatusLabel(status: ManageableForm["status"]) {
    switch (status) {
        case "Draft":
            return "Taslak";
        case "Published":
            return "Yayında";
        case "Closed":
            return "Kapatıldı";
        default:
            return status;
    }
}

function getStatusColor(
    status: ManageableForm["status"],
): "default" | "success" | "warning" {
    switch (status) {
        case "Draft":
            return "warning";
        case "Published":
            return "success";
        case "Closed":
            return "default";
        default:
            return "default";
    }
}

function getAccessTypeLabel(accessType: ManageableForm["accessType"]) {
    switch (accessType) {
        case "Public":
            return "Herkese Açık";
        case "Authenticated":
            return "Giriş Zorunlu";
        default:
            return accessType;
    }
}

export default function ManageableFormsPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [forms, setForms] = useState<ManageableForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [actionFormId, setActionFormId] = useState<number | null>(null);

    // Onay diyalogları için state'ler
    const [formToClose, setFormToClose] = useState<ManageableForm | null>(null);
    const [formToDelete, setFormToDelete] = useState<ManageableForm | null>(null);
    const [formToReopen, setFormToReopen] = useState<ManageableForm | null>(null);

    // Kopyalama bildirimi state'leri
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);

    // Sayfalama state'leri (5, 10, 20 veya -1: Tümü)
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(5);

    const totalItems = forms.length;
    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedForms = pageSize === -1 ? forms : forms.slice((page - 1) * pageSize, page * pageSize);
    const startItem = totalItems === 0 ? 0 : pageSize === -1 ? 1 : (page - 1) * pageSize + 1;
    const endItem = pageSize === -1 ? totalItems : Math.min(page * pageSize, totalItems);

    useEffect(() => {
        if (page > totalPages) {
            setPage(Math.max(1, totalPages));
        }
    }, [page, totalPages]);

    function handleCopyLink(publicId: string, status: ManageableForm["status"]) {
        const url = `${window.location.origin}/forms/${publicId}`;
        void navigator.clipboard.writeText(url).then(() => {
            if (status === "Published") {
                setSnackbarMessage("Anket katılım bağlantısı panoya kopyalandı!");
            } else {
                setSnackbarMessage("Anket bağlantısı panoya kopyalandı (Bilgi: Anket şu anda yayında değildir).");
            }
            setIsSnackbarOpen(true);
        });
    }

    function handleLogout() {
        logout();
        navigate("/login");
    }

    useEffect(() => {
        async function loadForms() {
            try {
                const response = await getManageableForms();

                if (!response.isSuccess || !response.data) {
                    setErrorMessage(
                        response.message ?? "Anketler yüklenemedi.",
                    );
                    return;
                }

                setForms(response.data);
            } catch (error) {
                setErrorMessage(
                    extractErrorMessage(error, "Anketler yüklenirken API bağlantısı kurulamadı."),
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadForms();
    }, []);

    async function handlePublish(formId: number, publicId: string) {
        setActionFormId(formId);
        setErrorMessage("");

        try {
            const response = await publishForm(publicId);

            if (!response.isSuccess || !response.data) {
                setErrorMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "Anket yayımlanamadı.",
                );
                return;
            }

            setForms((currentForms) =>
                currentForms.map((form) =>
                    form.id === formId
                        ? {
                            ...form,
                            status: "Published",
                        }
                        : form,
                ),
            );
        } catch (error) {
            setErrorMessage(
                extractErrorMessage(error, "Anket yayımlanırken bir hata oluştu."),
            );
        } finally {
            setActionFormId(null);
        }
    }

    async function confirmClose() {
        if (!formToClose) return;
        const targetForm = formToClose;
        setFormToClose(null);
        setActionFormId(targetForm.id);
        setErrorMessage("");

        try {
            const response = await closeForm(targetForm.publicId);

            if (!response.isSuccess || !response.data) {
                setErrorMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "Anket kapatılamadı.",
                );
                return;
            }

            setForms((currentForms) =>
                currentForms.map((form) =>
                    form.id === targetForm.id
                        ? {
                            ...form,
                            status: "Closed",
                        }
                        : form,
                ),
            );
        } catch (error) {
            setErrorMessage(
                extractErrorMessage(error, "Anket kapatılırken bir hata oluştu."),
            );
        } finally {
            setActionFormId(null);
        }
    }

    async function confirmReopen() {
        if (!formToReopen) return;
        const targetForm = formToReopen;
        setFormToReopen(null);
        setActionFormId(targetForm.id);
        setErrorMessage("");

        try {
            const response = await reopenForm(targetForm.publicId);

            if (!response.isSuccess || !response.data) {
                setErrorMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "Anket yeniden yayımlanamadı.",
                );
                return;
            }

            setForms((currentForms) =>
                currentForms.map((form) =>
                    form.id === targetForm.id
                        ? {
                            ...form,
                            status: "Published",
                        }
                        : form,
                ),
            );
        } catch (error) {
            setErrorMessage(
                extractErrorMessage(error, "Anket yeniden yayımlanırken bir hata oluştu."),
            );
        } finally {
            setActionFormId(null);
        }
    }

    async function confirmDelete() {
        if (!formToDelete) return;
        const targetForm = formToDelete;
        setFormToDelete(null);
        setActionFormId(targetForm.id);
        setErrorMessage("");

        try {
            const response = await deleteForm(targetForm.publicId);

            if (!response.isSuccess) {
                setErrorMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "Anket silinemedi.",
                );
                return;
            }

            setForms((currentForms) =>
                currentForms.filter((form) => form.id !== targetForm.id),
            );
        } catch (error) {
            setErrorMessage(
                extractErrorMessage(error, "Anket silinirken bir hata oluştu."),
            );
        } finally {
            setActionFormId(null);
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

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
            }}
        >
            <BrandHeader pageTitle="Anketlerim" onHome={() => navigate("/")} onLogout={handleLogout} />

            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Stack spacing={3}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                        <Box>
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                                Anketlerim
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Sahibi olduğunuz veya yetkili olduğunuz birimlere
                                ait anketleri buradan yönetin.
                            </Typography>
                        </Box>

                        <Button
                            component={RouterLink}
                            to="/forms/new"
                            variant="contained"
                            color="primary"
                            sx={{ fontWeight: 700, borderRadius: 2 }}
                        >
                            + Yeni Anket Oluştur
                        </Button>
                    </Box>

                    {errorMessage && (
                        <Alert severity="error" onClose={() => setErrorMessage("")}>
                            {errorMessage}
                        </Alert>
                    )}

                    {!errorMessage && forms.length === 0 && (
                        <Alert severity="info">
                            Görüntüleyebileceğiniz anket bulunmuyor.
                        </Alert>
                    )}

                    <Stack spacing={2}>
                        {paginatedForms.map((form) => (
                            <Card
                                key={form.id}
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderLeft: "6px solid",
                                    borderLeftColor:
                                        form.status === "Published"
                                            ? "success.main"
                                            : form.status === "Draft"
                                            ? "warning.main"
                                            : "grey.400",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.07)",
                                        borderColor: "primary.light",
                                    },
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                    <Stack spacing={2}>
                                        {/* Üst Kısım: Başlık ve Durum Rozetleri */}
                                        <Stack
                                            direction="row"
                                            sx={{
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                gap: 2,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 260 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: "text.primary",
                                                        letterSpacing: "-0.01em",
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    {form.title}
                                                </Typography>

                                                {form.description && (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            mt: 0.75,
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {form.description}
                                                    </Typography>
                                                )}
                                            </Box>

                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                                                <Chip
                                                    label={getStatusLabel(form.status)}
                                                    color={getStatusColor(form.status)}
                                                    size="small"
                                                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                                />
                                                <Chip
                                                    icon={
                                                        form.accessType === "Authenticated" ? (
                                                            <LockIcon sx={{ fontSize: "14px !important" }} />
                                                        ) : (
                                                            <PublicIcon sx={{ fontSize: "14px !important" }} />
                                                        )
                                                    }
                                                    label={getAccessTypeLabel(form.accessType)}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ borderRadius: 1.5, fontWeight: 500 }}
                                                />
                                            </Stack>
                                        </Stack>

                                        {/* Orta Kısım: Metadata & İstatistikler */}
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={{ xs: 1, sm: 2.5 }}
                                            sx={{
                                                alignItems: { xs: "flex-start", sm: "center" },
                                                py: 1,
                                                px: 1.5,
                                                bgcolor: "grey.50",
                                                borderRadius: 2,
                                                fontSize: "0.825rem",
                                                color: "text.secondary",
                                                flexWrap: "wrap",
                                                gap: 1,
                                            }}
                                        >
                                            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                                                <PersonIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                                                <span>
                                                    Oluşturan: <strong>{form.createdByUserName}</strong>
                                                </span>
                                            </Stack>

                                            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                                                <CalendarTodayIcon sx={{ fontSize: 15, color: "text.disabled" }} />
                                                <span>
                                                    {new Date(form.createdAt).toLocaleDateString("tr-TR", {
                                                        day: "2-digit",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </Stack>

                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                sx={{
                                                    alignItems: "center",
                                                    ml: { sm: "auto !important" },
                                                    bgcolor: form.responseCount > 0 ? "primary.50" : "transparent",
                                                    color: form.responseCount > 0 ? "primary.dark" : "text.secondary",
                                                    px: form.responseCount > 0 ? 1.5 : 0,
                                                    py: form.responseCount > 0 ? 0.3 : 0,
                                                    borderRadius: 1.5,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <AssessmentIcon sx={{ fontSize: 17 }} />
                                                <span>{form.responseCount} Yanıt</span>
                                            </Stack>
                                        </Stack>

                                        {/* Yetkili Birimler */}
                                        {form.roleNames.length > 0 && (
                                            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
                                                <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
                                                    Birimler:
                                                </Typography>
                                                {form.roleNames.map((roleName: string) => (
                                                    <Chip
                                                        key={roleName}
                                                        label={roleName}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: "0.725rem",
                                                            borderRadius: 1,
                                                            borderColor: "grey.300",
                                                            bgcolor: "background.paper",
                                                        }}
                                                    />
                                                ))}
                                            </Stack>
                                        )}

                                        <Divider sx={{ my: 0.5 }} />

                                        {/* Butonlar: Sol taraf işlem butonları, Sağ taraf ana aksiyon */}
                                        <Stack
                                            direction="row"
                                            sx={{
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: 1.25,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                                                {/* 👁️ Önizle */}
                                                <Button
                                                    component={RouterLink}
                                                    to={`/forms/${form.publicId}?preview=true`}
                                                    variant="outlined"
                                                    size="small"
                                                    color="info"
                                                    startIcon={<VisibilityIcon />}
                                                    sx={{ borderRadius: 1.5, fontWeight: 600 }}
                                                >
                                                    Önizle
                                                </Button>

                                                {/* ✏️ Düzenle */}
                                                {form.status !== "Closed" && (
                                                    <Button
                                                        component={RouterLink}
                                                        to={`/forms/${form.publicId}/edit`}
                                                        variant="outlined"
                                                        size="small"
                                                        color="inherit"
                                                        startIcon={<EditIcon />}
                                                        sx={{ borderRadius: 1.5, fontWeight: 600 }}
                                                    >
                                                        Düzenle
                                                    </Button>
                                                )}

                                                {/* 🔗 Bağlantıyı Kopyala */}
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="secondary"
                                                    startIcon={<ContentCopyIcon />}
                                                    onClick={() => handleCopyLink(form.publicId, form.status)}
                                                    sx={{ borderRadius: 1.5, fontWeight: 600 }}
                                                >
                                                    Bağlantı
                                                </Button>

                                                {/* 🔒 Anketi Kapat */}
                                                {form.status === "Published" && (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        color="warning"
                                                        onClick={() => setFormToClose(form)}
                                                        disabled={actionFormId === form.id}
                                                        sx={{ borderRadius: 1.5, fontWeight: 600 }}
                                                    >
                                                        Kapat
                                                    </Button>
                                                )}

                                                {/* 🗑️ Anketi Sil */}
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    color="error"
                                                    startIcon={<DeleteOutlineIcon />}
                                                    onClick={() => setFormToDelete(form)}
                                                    disabled={actionFormId === form.id}
                                                    sx={{ borderRadius: 1.5, fontWeight: 600 }}
                                                >
                                                    Sil
                                                </Button>
                                            </Stack>

                                            {/* Sağdaki Ana Aksiyon Butonu */}
                                            <Box>
                                                {form.status === "Draft" && (
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<PublishIcon />}
                                                        onClick={() => handlePublish(form.id, form.publicId)}
                                                        disabled={actionFormId === form.id}
                                                        sx={{ borderRadius: 1.5, fontWeight: 700, px: 2 }}
                                                    >
                                                        {actionFormId === form.id ? "Yayımlanıyor..." : "Anketi Yayınla"}
                                                    </Button>
                                                )}

                                                {form.status === "Closed" && (
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<ReplayIcon />}
                                                        onClick={() => setFormToReopen(form)}
                                                        disabled={actionFormId === form.id}
                                                        sx={{ borderRadius: 1.5, fontWeight: 700, px: 2 }}
                                                    >
                                                        Tekrar Yayınla
                                                    </Button>
                                                )}

                                                {(form.status === "Published" || form.status === "Closed") && (
                                                    <Button
                                                        component={RouterLink}
                                                        to={`/forms/${form.publicId}/responses`}
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<AssessmentIcon />}
                                                        sx={{ borderRadius: 1.5, fontWeight: 700, px: 2 }}
                                                    >
                                                        Yanıtları İncele
                                                    </Button>
                                                )}
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>

                    {/* 📄 Sayfalama Kontrolleri */}
                    {forms.length > 0 && (
                        <Card
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 2.5,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "background.paper",
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                                sx={{
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    {pageSize === -1
                                        ? `Toplam ${totalItems} anket listeleniyor`
                                        : `Toplam ${totalItems} anketten ${startItem} - ${endItem} arası gösteriliyor`}
                                </Typography>

                                <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                            Sayfa başına:
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 95 }}>
                                            <Select
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value));
                                                    setPage(1);
                                                }}
                                                sx={{ height: 36, fontSize: "0.875rem", borderRadius: 1.5 }}
                                            >
                                                <MenuItem value={5}>5</MenuItem>
                                                <MenuItem value={10}>10</MenuItem>
                                                <MenuItem value={20}>20</MenuItem>
                                                <MenuItem value={-1}>Tümü</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>

                                    {pageSize !== -1 && totalPages > 1 && (
                                        <Pagination
                                            count={totalPages}
                                            page={page}
                                            onChange={(_, newPage) => {
                                                setPage(newPage);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            color="primary"
                                            shape="rounded"
                                            size="medium"
                                        />
                                    )}
                                </Stack>
                            </Stack>
                        </Card>
                    )}
                </Stack>
            </Container>

            {/* Anket Kapatma Onay Modalı */}
            <Dialog open={Boolean(formToClose)} onClose={() => setFormToClose(null)}>
                <DialogTitle>Anketi Kapat</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <strong>{formToClose?.title}</strong> anketini kapatmak istediğinizden emin misiniz?
                        Kapatılan anketlere katılımcılar artık yeni yanıt gönderemez.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormToClose(null)}>İptal</Button>
                    <Button color="warning" variant="contained" onClick={confirmClose}>
                        Anketi Kapat
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Anketi Yeniden Yayınlama Onay Modalı */}
            <Dialog open={Boolean(formToReopen)} onClose={() => setFormToReopen(null)}>
                <DialogTitle>Anketi Tekrar Yayınla</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <strong>{formToReopen?.title}</strong> anketini tekrar yayına almak istediğinizden emin misiniz?
                        Katılımcılar yeniden forma erişip yanıt gönderebilecektir.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormToReopen(null)}>İptal</Button>
                    <Button color="success" variant="contained" onClick={confirmReopen}>
                        Tekrar Yayınla
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Anket Silme Onay Modalı */}
            <Dialog open={Boolean(formToDelete)} onClose={() => setFormToDelete(null)}>
                <DialogTitle>Anketi Kalıcı Olarak Sil</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <strong>{formToDelete?.title}</strong> anketini ve bu ankete ait <strong>tüm soru ve yanıtları</strong> kalıcı olarak silmek istediğinizden emin misiniz?
                        <br />
                        <span style={{ color: "red", fontWeight: "bold" }}>Bu işlem geri alınamaz!</span>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormToDelete(null)}>Vazgeç</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>
                        Evet, Kalıcı Olarak Sil
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bağlantı kopyalama bildirimi */}
            <Snackbar
                open={isSnackbarOpen}
                autoHideDuration={3500}
                onClose={() => setIsSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Box>
    );
}