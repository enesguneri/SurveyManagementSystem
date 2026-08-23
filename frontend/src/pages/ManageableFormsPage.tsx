import { useEffect, useState } from "react";
import axios from "axios";
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
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import { getManageableForms } from "../api/formApi";
import type { ManageableForm } from "../types/manageableForm";

function getStatusLabel(status: ManageableForm["status"]) {
    switch (status) {
        case "Draft":
            return "Taslak";
        case "Published":
            return "Yayımlandı";
        case "Closed":
            return "Kapalı";
        default:
            return status;
    }
}

function getStatusColor(
    status: ManageableForm["status"],
) {
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

export default function ManageableFormsPage() {
    const navigate = useNavigate();

    const [forms, setForms] = useState<ManageableForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        async function loadForms() {
            try {
                const response = await getManageableForms();

                if (!response.isSuccess || !response.data) {
                    setErrorMessage(
                        response.message ??
                        "Formlar yüklenemedi.",
                    );
                    return;
                }

                setForms(response.data);
            } catch (error) {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 401
                ) {
                    setErrorMessage(
                        "Formları görmek için giriş yapmalısınız.",
                    );
                    return;
                }

                setErrorMessage(
                    "Formlar yüklenirken API bağlantısı kurulamadı.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadForms();
    }, []);

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
            <Toolbar
                sx={{
                    justifyContent: "space-between",
                    backgroundColor: "white",
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Yönetilebilir Formlar
                </Typography>

                <Button
                    variant="outlined"
                    onClick={() => navigate("/")}
                >
                    Dashboard
                </Button>
            </Toolbar>

            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" component="h1">
                            Formlar
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            Sahibi olduğunuz veya birim rolleriniz
                            üzerinden erişebildiğiniz formlar.
                        </Typography>
                    </Box>

                    {errorMessage && (
                        <Alert severity="error">
                            {errorMessage}
                        </Alert>
                    )}

                    {!errorMessage && forms.length === 0 && (
                        <Alert severity="info">
                            Görüntüleyebileceğiniz form bulunmuyor.
                        </Alert>
                    )}

                    <Stack spacing={2}>
                        {forms.map((form) => (
                            <Card key={form.id}>
                                <CardContent>
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

                                            <Chip
                                                label={getStatusLabel(
                                                    form.status,
                                                )}
                                                color={getStatusColor(
                                                    form.status,
                                                )}
                                            />
                                        </Stack>

                                        {form.description && (
                                            <Typography
                                                color="text.secondary"
                                            >
                                                {form.description}
                                            </Typography>
                                        )}

                                        <Typography variant="body2">
                                            Oluşturan:{" "}
                                            {form.createdByUserName}
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

                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{
                                                flexWrap: "wrap",
                                                gap: 1,
                                            }}
                                        >
                                            {form.roleNames.map(
                                                (roleName) => (
                                                    <Chip
                                                        key={roleName}
                                                        label={roleName}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ),
                                            )}
                                        </Stack>

                                        {form.status === "Draft" && (
                                            <Button
                                                variant="contained"
                                                onClick={() =>
                                                    navigate(
                                                        `/forms/${form.publicId}/edit`,
                                                    )
                                                }
                                            >
                                                Düzenle
                                            </Button>
                                        )}

                                        {form.status === "Published" && (
                                            <Button
                                                variant="outlined"
                                                onClick={() =>
                                                    navigate(
                                                        `/forms/${form.publicId}`,
                                                    )
                                                }
                                            >
                                                Formu Görüntüle
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
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}