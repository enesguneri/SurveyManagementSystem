import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
            const apiErrors = axios.isAxiosError(error) ? error.response?.data?.errors : undefined;
            const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : undefined;

            setErrorMessage(
                apiErrors?.join(" ") ||
                apiMessage ||
                "API bağlantısı kurulamadı veya kayıt başarısız.",
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
                                    Kayıt Ol
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
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
                                        {isSubmitting ? "Kayıt olunuyor..." : "Kayıt Ol"}
                                    </Button>
                                </Stack>
                            </Box>

                            <Button
                                type="button"
                                variant="text"
                                onClick={() => navigate("/login")}
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