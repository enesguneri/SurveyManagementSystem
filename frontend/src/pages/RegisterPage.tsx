import { useState, type FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
import { register as registerRequest } from "../api/authApi";
import { extractErrorMessage } from "../utils/errorHandler";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const result = await registerRequest({
                name,
                username,
                email,
                password,
            });

            if (!result.isSuccess) {
                setErrorMessage(
                    result.errors?.join(" ") ||
                    result.message ||
                    "Kayıt işlemi başarısız.",
                );
                return;
            }

            navigate("/login");
        } catch (error: unknown) {
            setErrorMessage(
                extractErrorMessage(
                    error,
                    "Kayıt işlemi sırasında bir hata oluştu.",
                ),
            );
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
                <Card elevation={4} sx={{ borderRadius: 3 }}>
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
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }} gutterBottom>
                                    Yeni Hesap Oluştur
                                </Typography>

                                <Typography variant="body1" color="text.secondary">
                                    İzmir Bakırçay Üniversitesi Anket Yönetim Sistemi
                                </Typography>
                            </Box>

                            <Box
                                component="form"
                                onSubmit={handleSubmit}
                                sx={{ width: "100%" }}
                            >
                                <Stack spacing={2}>
                                    <TextField
                                        label="Ad Soyad"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        autoComplete="name"
                                        required
                                    />

                                    <TextField
                                        label="Kullanıcı Adı"
                                        value={username}
                                        onChange={(event) => setUsername(event.target.value)}
                                        autoComplete="username"
                                        required
                                    />

                                    <TextField
                                        label="E-posta"
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        autoComplete="email"
                                        required
                                    />

                                    <TextField
                                        label="Şifre"
                                        type="password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        autoComplete="new-password"
                                        required
                                        helperText="En az 6 karakter olmalıdır."
                                    />

                                    {errorMessage && (
                                        <Alert severity="error" onClose={() => setErrorMessage("")}>
                                            {errorMessage}
                                        </Alert>
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
                                        {isSubmitting ? "Kayıt olunuyor..." : "Kayıt Ol"}
                                    </Button>
                                </Stack>
                            </Box>

                            <Button
                                component={RouterLink}
                                to="/login"
                                type="button"
                                variant="text"
                            >
                                Zaten hesabınız var mı? Giriş yapın
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}