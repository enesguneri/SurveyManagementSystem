import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    Stack,
    Typography,
} from "@mui/material";
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
            return "default";
        case "Published":
            return "success";
        case "Closed":
            return "warning";
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
                            variant="contained"
                            color="primary"
                            onClick={() => navigate("/forms/new")}
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
                        {forms.map((form) => (
                            <Card key={form.id} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
                                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                    <Stack spacing={2}>
                                        <Stack
                                            direction="row"
                                            sx={{
                                                justifyContent:
                                                    "space-between",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {form.title}
                                            </Typography>

                                            <Stack
                                                direction="row"
                                                spacing={1}
                                            >
                                                <Chip
                                                    label={getStatusLabel(
                                                        form.status,
                                                    )}
                                                    color={getStatusColor(
                                                        form.status,
                                                    )}
                                                    size="small"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                                <Chip
                                                    label={getAccessTypeLabel(
                                                        form.accessType,
                                                    )}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </Stack>
                                        </Stack>

                                        {form.description && (
                                            <Typography color="text.secondary">
                                                {form.description}
                                            </Typography>
                                        )}

                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Oluşturan: <strong>{form.createdByUserName}</strong>
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                Oluşturulma:{" "}
                                                {new Date(
                                                    form.createdAt,
                                                ).toLocaleString("tr-TR")}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 600, color: "primary.main" }}
                                            >
                                                Yanıt sayısı: {form.responseCount}
                                            </Typography>
                                        </Stack>

                                        {form.roleNames.length > 0 && (
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                sx={{
                                                    flexWrap: "wrap",
                                                    gap: 1,
                                                }}
                                            >
                                                {form.roleNames.map(
                                                    (roleName: string) => (
                                                        <Chip
                                                            key={roleName}
                                                            label={roleName}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ),
                                                )}
                                            </Stack>
                                        )}

                                        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1, pt: 1 }}>
                                            {form.status === "Draft" && (
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() =>
                                                        handlePublish(form.id, form.publicId)
                                                    }
                                                    disabled={actionFormId === form.id}
                                                >
                                                    {actionFormId === form.id
                                                        ? "Yayımlanıyor..."
                                                        : "Anketi Yayınla"}
                                                </Button>
                                            )}

                                            {form.status === "Closed" && (
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => setFormToReopen(form)}
                                                    disabled={actionFormId === form.id}
                                                >
                                                    Tekrar Yayınla
                                                </Button>
                                            )}

                                            {/* ✏️ Düzenle: Hem Taslak hem Yayındaki Anketler İçin Aktif */}
                                            {form.status !== "Closed" && (
                                                <Button
                                                    variant="outlined"
                                                    onClick={() =>
                                                        navigate(
                                                            `/forms/${form.publicId}/edit`,
                                                        )
                                                    }
                                                >
                                                    Düzenle
                                                </Button>
                                            )}

                                            {/* Anketi Görüntüle: Yayında ve Kapalı anketler için */}
                                            {(form.status === "Published" || form.status === "Closed") && (
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() =>
                                                        navigate(
                                                            `/forms/${form.publicId}`,
                                                        )
                                                    }
                                                >
                                                    Anketi Görüntüle
                                                </Button>
                                            )}

                                            {form.status === "Published" && (
                                                <Button
                                                    variant="outlined"
                                                    color="warning"
                                                    onClick={() => setFormToClose(form)}
                                                    disabled={actionFormId === form.id}
                                                >
                                                    Anketi Kapat
                                                </Button>
                                            )}

                                            {(form.status === "Published" ||
                                                form.status === "Closed") && (
                                                <Button
                                                    variant="contained"
                                                    onClick={() =>
                                                        navigate(
                                                            `/forms/${form.publicId}/responses`,
                                                        )
                                                    }
                                                >
                                                    Yanıtları Görüntüle
                                                </Button>
                                            )}

                                            {/* Anketi Sil Butonu */}
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => setFormToDelete(form)}
                                                disabled={actionFormId === form.id}
                                            >
                                                Anketi Sil
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
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
        </Box>
    );
}