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
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { getAdminUsers } from "../api/adminApi";
import {
    assignRole,
    createRole,
    getAllRoles,
} from "../api/roleApi";
import type { Role } from "../types/role";
import type { AdminUser } from "../types/admin";

import { useAuth } from "../auth/useAuth";
import BrandHeader from "../components/layout/BrandHeader";
import { extractErrorMessage } from "../utils/errorHandler";

export default function AdminPanelPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedUserId, setSelectedUserId] =
        useState<number | "">("");
    const [selectedRoleId, setSelectedRoleId] =
        useState<number | "">("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignmentMessage, setAssignmentMessage] =
        useState("");
    const [newRoleName, setNewRoleName] = useState("");
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [roleCreationMessage, setRoleCreationMessage] =
        useState("");

    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await getAdminUsers();

                if (!response.isSuccess || !response.data) {
                    setErrorMessage(
                        response.message ??
                        "Kullanıcılar yüklenemedi.",
                    );
                    return;
                }

                setUsers(response.data);
            } catch (error) {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 403
                ) {
                    setErrorMessage(
                        "Bu sayfayı görüntülemek için Admin yetkisi gerekir.",
                    );
                    return;
                }

                setErrorMessage(
                    extractErrorMessage(error, "Kullanıcılar yüklenirken API bağlantısı kurulamadı."),
                );
            } finally {
                setIsLoading(false);
            }
        }
        void loadUsers();
    }, []);

    useEffect(() => {
        async function loadRoles() {
            try {
                const response = await getAllRoles();

                if (!response.isSuccess || !response.data) {
                    setAssignmentMessage(
                        response.message ??
                        "Roller yüklenemedi.",
                    );
                    return;
                }

                setRoles(response.data);
            } catch (error) {
                setAssignmentMessage(
                    extractErrorMessage(error, "Roller yüklenirken API bağlantısı kurulamadı."),
                );
            }
        }

        void loadRoles();
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

    async function handleAssignRole() {
        if (selectedUserId === "" || selectedRoleId === "") {
            setAssignmentMessage(
                "Kullanıcı ve rol seçmelisiniz.",
            );
            return;
        }

        setIsAssigning(true);
        setAssignmentMessage("");

        try {
            const response = await assignRole(
                selectedUserId,
                selectedRoleId,
            );

            if (!response.isSuccess) {
                setAssignmentMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "Rol atanamadı.",
                );
                return;
            }

            setAssignmentMessage(
                "Rol kullanıcıya başarıyla atandı.",
            );

            // Güncel rol listesini tekrar getirir.
            const usersResponse = await getAdminUsers();

            if (usersResponse.isSuccess && usersResponse.data) {
                setUsers(usersResponse.data);
            }
        } catch (error) {
            setAssignmentMessage(
                extractErrorMessage(error, "Rol atanırken bir hata oluştu."),
            );
        } finally {
            setIsAssigning(false);
        }
    }

    // Admin tarafından yeni birim rolü oluşturur.
    async function handleCreateRole() {
        const normalizedRoleName = newRoleName.trim();

        if (!normalizedRoleName) {
            setRoleCreationMessage(
                "Birim rolü adı boş bırakılamaz.",
            );
            return;
        }

        setIsCreatingRole(true);
        setRoleCreationMessage("");

        try {
            const response = await createRole(
                normalizedRoleName,
            );

            if (!response.isSuccess) {
                setRoleCreationMessage(
                    response.errors?.join(" ") ??
                    response.message ??
                    "Birim rolü oluşturulamadı.",
                );
                return;
            }

            setRoleCreationMessage(
                "Birim rolü başarıyla oluşturuldu.",
            );
            setNewRoleName("");

            // Yeni rolü seçim listesinin güncel kalması için tekrar yükler.
            const rolesResponse = await getAllRoles();

            if (rolesResponse.isSuccess && rolesResponse.data) {
                setRoles(rolesResponse.data);
            }
        } catch (error) {
            setRoleCreationMessage(
                extractErrorMessage(error, "Rol oluşturulurken bir hata oluştu."),
            );
        } finally {
            setIsCreatingRole(false);
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
            }}
        >
            <BrandHeader pageTitle="Yönetici Paneli" onHome={() => navigate("/")} onLogout={handleLogout} />

            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" component="h1">
                            Kullanıcı Yönetimi
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            Kullanıcıları ve sahip oldukları birim
                            rollerini görüntüleyin.
                        </Typography>
                    </Box>

                    {errorMessage && (
                        <Alert severity="error">
                            {errorMessage}
                        </Alert>
                    )}

                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6">
                                    Yeni Birim Rolü Oluştur
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Örneğin Kariyer Merkezi veya Mühendislik Fakültesi.
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="Birim adı"
                                    value={newRoleName}
                                    onChange={(event) =>
                                        setNewRoleName(event.target.value)
                                    }
                                    disabled={isCreatingRole}
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleCreateRole}
                                    disabled={isCreatingRole}
                                >
                                    {isCreatingRole
                                        ? "Oluşturuluyor..."
                                        : "Birim Rolü Oluştur"}
                                </Button>

                                {roleCreationMessage && (
                                    <Alert severity="info">
                                        {roleCreationMessage}
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6">
                                    Kullanıcıya Rol Ata
                                </Typography>

                                <FormControl fullWidth>
                                    <InputLabel id="admin-user-label">
                                        Kullanıcı
                                    </InputLabel>

                                    <Select
                                        labelId="admin-user-label"
                                        value={selectedUserId}
                                        label="Kullanıcı"
                                        onChange={(event) =>
                                            setSelectedUserId(Number(event.target.value))
                                        }
                                    >
                                        {users.map((user) => (
                                            <MenuItem
                                                key={user.id}
                                                value={user.id}
                                            >
                                                {user.name} (
                                                {user.username})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel id="admin-role-label">
                                        Rol
                                    </InputLabel>

                                    <Select
                                        labelId="admin-role-label"
                                        value={selectedRoleId}
                                        label="Rol"
                                        onChange={(event) =>
                                            setSelectedRoleId(Number(event.target.value))
                                        }
                                    >
                                        {roles.map((role) => (
                                            <MenuItem
                                                key={role.id}
                                                value={role.id}
                                            >
                                                {role.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="contained"
                                    onClick={handleAssignRole}
                                    disabled={isAssigning}
                                >
                                    {isAssigning
                                        ? "Atanıyor..."
                                        : "Rol Ata"}
                                </Button>

                                {assignmentMessage && (
                                    <Alert severity="info">
                                        {assignmentMessage}
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>

                    {!errorMessage && (
                        <TableContainer
                            component={Paper}
                            elevation={2}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            Kullanıcı
                                        </TableCell>
                                        <TableCell>
                                            E-posta
                                        </TableCell>
                                        <TableCell>
                                            Roller
                                        </TableCell>
                                        <TableCell>
                                            Durum
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <Stack>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {user.name}
                                                    </Typography>

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {user.username}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                {user.email}
                                            </TableCell>

                                            <TableCell>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        flexWrap: "wrap",
                                                        gap: 1,
                                                    }}
                                                >
                                                    {user.roles.map(
                                                        (role) => (
                                                            <Chip
                                                                key={role}
                                                                label={role}
                                                                size="small"
                                                            />
                                                        ),
                                                    )}
                                                </Stack>
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={
                                                        user.isActive
                                                            ? "Aktif"
                                                            : "Pasif"
                                                    }
                                                    color={
                                                        user.isActive
                                                            ? "success"
                                                            : "default"
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}