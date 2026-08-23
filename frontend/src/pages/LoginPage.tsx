import { useState, type FormEvent } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const isSuccessful = await login({
                usernameOrEmail,
                password,
            });

            if (!isSuccessful) {
                setErrorMessage("Kullanıcı adı/e-posta veya şifre hatalı.");
                return;
            }

            const searchParams = new URLSearchParams(
                location.search,
            );

            const returnUrl = searchParams.get("returnUrl");

            // Yalnızca uygulama içindeki relative URL'lere izin verilir.
            // Böylece dış siteye yönlendirme güvenlik açığı oluşmaz.
            const safeReturnUrl =
                returnUrl && returnUrl.startsWith("/")
                    ? returnUrl
                    : "/";

            navigate(safeReturnUrl);
        } catch {
            setErrorMessage("Giriş sırasında beklenmeyen bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                backgroundColor: "background.default",
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Card elevation={4}>
                    <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                        <Stack spacing={3} sx={{ alignItems: "center" }}>
                            <Box
                                component="img"
                                src="/assets/bakircay-logo.png"
                                alt="İzmir Bakırçay Üniversitesi"
                                sx={{
                                    width: 180,
                                    maxWidth: "100%",
                                    objectFit: "contain",
                                }}
                            />

                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" component="h1" gutterBottom>
                                    İzmir Bakırçay Üniversitesi Anket Yönetim Sistemi
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    İzmir Bakırçay Üniversitesi
                                </Typography>
                            </Box>

                            <Box
                                component="form"
                                onSubmit={handleSubmit}
                                sx={{ width: "100%" }}
                            >
                                <Stack spacing={2}>
                                    <TextField
                                        label="Kullanıcı adı veya e-posta"
                                        value={usernameOrEmail}
                                        onChange={(event) =>
                                            setUsernameOrEmail(event.target.value)
                                        }
                                        autoComplete="username"
                                        required
                                    />

                                    <TextField
                                        label="Şifre"
                                        type="password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />

                                    {errorMessage && (
                                        <Alert severity="error">{errorMessage}</Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={isSubmitting}
                                        startIcon={
                                            isSubmitting ? (
                                                <CircularProgress size={18} color="inherit" />
                                            ) : undefined
                                        }
                                    >
                                        {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
                                    </Button>
                                </Stack>
                            </Box>

                            <Button
                                type="button"
                                variant="text"
                                onClick={() => navigate("/register")}
                            >
                                Hesabınız yok mu? Kayıt olun
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}