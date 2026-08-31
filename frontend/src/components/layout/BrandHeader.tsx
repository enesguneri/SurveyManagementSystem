import { AppBar, Box, Button, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

interface BrandHeaderProps {
    /** Geçerli sayfanın Türkçe adı. */
    pageTitle?: string;
    onHome?: () => void;
    onLogout?: () => void;
}

/** Uygulamadaki korumalı sayfalar için ortak üniversite başlığı. */
export default function BrandHeader({ pageTitle, onHome, onLogout }: BrandHeaderProps) {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    return (
        <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{
                borderBottom: "1px solid rgba(15, 118, 110, 0.14)",
                backgroundColor: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(16px)",
            }}
        >
            <Toolbar
                sx={{
                    width: "100%",
                    maxWidth: 1280,
                    mx: "auto",
                    minHeight: { xs: 72, sm: 84 },
                    px: { xs: 2, sm: 3 },
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Tooltip title="Ana Sayfaya Git" arrow>
                    <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                            alignItems: "center",
                            minWidth: 0,
                            cursor: "pointer",
                            p: 0.75,
                            borderRadius: 2,
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                                backgroundColor: "rgba(15, 118, 110, 0.06)",
                                transform: "translateY(-1px)",
                            },
                        }}
                        onClick={() => navigate("/")}
                    >
                        <Box
                            component="img"
                            src="/assets/bakircay-logo.png"
                            alt="İzmir Bakırçay Üniversitesi"
                            sx={{
                                width: { xs: 44, sm: 56 },
                                height: { xs: 44, sm: 56 },
                                objectFit: "contain",
                            }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 800,
                                    lineHeight: 1.2,
                                    color: "primary.dark",
                                }}
                                noWrap
                            >
                                İzmir Bakırçay Üniversitesi
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                                Anket Yönetim Sistemi{pageTitle ? ` • ${pageTitle}` : ""}
                            </Typography>
                        </Box>
                    </Stack>
                </Tooltip>

                <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: "center" }}>
                    {isAdmin && (
                        <Button
                            color="secondary"
                            variant="outlined"
                            startIcon={<AdminPanelSettingsOutlinedIcon />}
                            onClick={() => navigate("/admin")}
                            sx={{ display: { xs: "none", md: "inline-flex" }, fontWeight: 700 }}
                        >
                            Admin Paneli
                        </Button>
                    )}
                    {onHome && (
                        <Button
                            color="primary"
                            variant="text"
                            startIcon={<HomeOutlinedIcon />}
                            onClick={onHome}
                            sx={{ display: { xs: "none", sm: "inline-flex" } }}
                        >
                            Ana Sayfa
                        </Button>
                    )}
                    {onLogout && (
                        <Button
                            color="primary"
                            variant="outlined"
                            startIcon={<LogoutOutlinedIcon />}
                            onClick={onLogout}
                        >
                            Çıkış Yap
                        </Button>
                    )}
                </Stack>
            </Toolbar>
        </AppBar>
    );
}
