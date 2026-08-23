import { useNavigate } from "react-router-dom";
import {
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
            <AppBar position="static" color="inherit" elevation={1}>
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Box
                            component="img"
                            src="/assets/bakircay-logo.png"
                            alt="İzmir Bakırçay Üniversitesi"
                            sx={{
                                width: 48,
                                height: 48,
                                objectFit: "contain",
                            }}
                        />

                        <Box>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 700 }}
                            >
                                İzmir Bakırçay Üniversitesi
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                                Anket Yönetim Sistemi
                            </Typography>
                        </Box>
                    </Stack>

                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleLogout}
                    >
                        Çıkış Yap
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Stack spacing={4}>
                    <Box>
                        <Chip
                            label="Survey Management System"
                            color="primary"
                            variant="outlined"
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="h3" component="h1" gutterBottom>
                            Anket yönetim paneli
                        </Typography>

                        <Typography variant="body1" color="text.secondary">
                            Formlarınızı oluşturun, yayımlayın ve yanıtları yönetin.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(3, 1fr)",
                            },
                            gap: 3,
                        }}
                    >
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h6">
                                        Yeni anket oluştur
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        Dinamik soru tipleri kullanarak yeni bir form hazırlayın.
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        onClick={() => navigate("/forms/new")}
                                    >
                                        Form Oluştur
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h6">
                                        Formlarım
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        Taslak, yayımlanmış ve kapatılmış formlarınızı yönetin.
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        onClick={() => navigate("/forms")}
                                    >
                                        Formları Görüntüle
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h6">
                                        Yanıtlar
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        Form yanıtlarını ve katılımcı verilerini inceleyin.
                                    </Typography>

                                    <Button variant="outlined">
                                        Yanıtları Görüntüle
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