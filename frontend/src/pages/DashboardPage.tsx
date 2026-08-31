import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import AddCircleOutlineRounded from "@mui/icons-material/AddCircleOutlineRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import FolderOpenRounded from "@mui/icons-material/FolderOpenRounded";
import { useAuth } from "../auth/useAuth";
import BrandHeader from "../components/layout/BrandHeader";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";

export default function DashboardPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <BrandHeader pageTitle="Ana Sayfa" onLogout={handleLogout} />

            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
                <Stack spacing={{ xs: 4, md: 6 }}>
                    <Box
                        sx={{
                            p: { xs: 3, md: 5 },
                            borderRadius: 5,
                            color: "white",
                            background:
                                "linear-gradient(135deg, #005b61 0%, #007c83 58%, #57b9b5 100%)",
                            boxShadow: "0 20px 50px rgba(0, 91, 97, 0.20)",
                        }}
                    >
                        <Typography
                            variant="overline"
                            sx={{ letterSpacing: 1.6, fontWeight: 700, opacity: 0.84 }}
                        >
                            Ana Sayfa
                        </Typography>
                        <Typography
                            variant="h3"
                            component="h1"
                            sx={{
                                mt: 1,
                                maxWidth: 760,
                                fontSize: { xs: "2rem", md: "3.2rem" },
                                lineHeight: 1.1,
                                fontWeight: 800,
                            }}
                        >
                            İzmir Bakırçay Üniversitesi Anket Yönetim Sistemi
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{ mt: 2, maxWidth: 680, fontWeight: 400, opacity: 0.9 }}
                        >
                            Anketlerinizi oluşturun, yayınlayın ve yanıtları kolayca yönetin.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                            gap: 3,
                        }}
                    >
                        <Card sx={{ height: "100%" }}>
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack spacing={2.5} sx={{ height: "100%" }}>
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            display: "grid",
                                            placeItems: "center",
                                            borderRadius: 3,
                                            color: "primary.main",
                                            backgroundColor: "rgba(87, 185, 181, 0.18)",
                                        }}
                                    >
                                        <AddCircleOutlineRounded fontSize="large" />
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                            Yeni anket oluştur
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                                            Kısa yanıt, seçenek, derecelendirme, tablo ve tarih
                                            gibi soru tipleriyle yeni bir anket hazırlayın.
                                        </Typography>
                                    </Box>
                                    <Button
                                        component={RouterLink}
                                        to="/forms/new"
                                        variant="contained"
                                        endIcon={<ArrowForwardRounded />}
                                        sx={{ alignSelf: "flex-start" }}
                                    >
                                        Anket Oluştur
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card sx={{ height: "100%" }}>
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack spacing={2.5} sx={{ height: "100%" }}>
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            display: "grid",
                                            placeItems: "center",
                                            borderRadius: 3,
                                            color: "secondary.dark",
                                            backgroundColor: "rgba(224, 138, 93, 0.16)",
                                        }}
                                    >
                                        <FolderOpenRounded fontSize="large" />
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                            Anketlerim
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                                            Taslak, yayımlanmış ve kapatılmış anketlerinizi
                                            tek bir ekrandan yönetin.
                                        </Typography>
                                    </Box>
                                    <Button
                                        component={RouterLink}
                                        to="/forms"
                                        variant="contained"
                                        endIcon={<ArrowForwardRounded />}
                                        sx={{ alignSelf: "flex-start" }}
                                    >
                                        Anketleri Görüntüle
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card sx={{ height: "100%" }}>
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Stack spacing={2.5} sx={{ height: "100%" }}>
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            display: "grid",
                                            placeItems: "center",
                                            borderRadius: 3,
                                            color: "secondary.dark",
                                            backgroundColor:
                                                "rgba(224, 138, 93, 0.16)",
                                        }}
                                    >
                                        <AutoAwesomeRounded fontSize="large" />
                                    </Box>

                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography
                                            variant="h5"
                                            sx={{ fontWeight: 800 }}
                                        >
                                            AI ile anket oluştur
                                        </Typography>

                                        <Typography
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            Anket fikrinizi açıklayın, yapay zekâ
                                            ile taslak sorular oluşturun.
                                        </Typography>
                                    </Box>

                                    <Button
                                        component={RouterLink}
                                        to="/ai/survey"
                                        variant="contained"
                                        sx={{ alignSelf: "flex-start" }}
                                    >
                                        AI Asistanını Aç
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}
