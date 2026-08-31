import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Autocomplete,
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
    InputAdornment,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";

import { getAdminUsers } from "../api/adminApi";
import {
    assignRole,
    createRole,
    getAllRoles,
    getRolesWithUsers,
    removeRoleFromUser,
} from "../api/roleApi";
import type { Role, RoleWithUsers } from "../types/role";
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

    // Tab state (0 = Kullanıcılar, 1 = Birimler)
    const [currentTab, setCurrentTab] = useState(0);

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesWithUsers, setRolesWithUsers] = useState<RoleWithUsers[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Kullanıcı arama filtresi
    const [userSearchQuery, setUserSearchQuery] = useState("");

    // Birim oluşturma state'i
    const [newRoleName, setNewRoleName] = useState("");
    const [isCreatingRole, setIsCreatingRole] = useState(false);

    // Satır içi rol atama menüsü state'leri
    const [addRoleMenuAnchor, setAddRoleMenuAnchor] = useState<{
        element: HTMLElement;
        user: AdminUser;
    } | null>(null);

    // Rol silme teyit modalı
    const [roleToRemove, setRoleToRemove] = useState<{
        userId: number;
        userName: string;
        roleId: number;
        roleName: string;
    } | null>(null);

    // Birime kullanıcı ekleme state'i (Birim ID -> Seçilen AdminUser)
    const [selectedUserForUnit, setSelectedUserForUnit] = useState<
        Record<number, AdminUser | null>
    >({});

    async function loadData() {
        try {
            const [usersRes, rolesRes, rolesWithUsersRes] = await Promise.all([
                getAdminUsers(),
                getAllRoles(),
                getRolesWithUsers(),
            ]);

            if (usersRes.isSuccess && usersRes.data) {
                setUsers(usersRes.data);
            }
            if (rolesRes.isSuccess && rolesRes.data) {
                setRoles(rolesRes.data);
            }
            if (rolesWithUsersRes.isSuccess && rolesWithUsersRes.data) {
                setRolesWithUsers(rolesWithUsersRes.data);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                setErrorMessage("Bu sayfayı görüntülemek için Admin yetkisi gerekir.");
                return;
            }
            setErrorMessage(
                extractErrorMessage(error, "Veriler yüklenirken API bağlantısı kurulamadı."),
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let isMounted = true;
        async function init() {
            try {
                const [usersRes, rolesRes, rolesWithUsersRes] = await Promise.all([
                    getAdminUsers(),
                    getAllRoles(),
                    getRolesWithUsers(),
                ]);

                if (!isMounted) return;
                if (usersRes.isSuccess && usersRes.data) {
                    setUsers(usersRes.data);
                }
                if (rolesRes.isSuccess && rolesRes.data) {
                    setRoles(rolesRes.data);
                }
                if (rolesWithUsersRes.isSuccess && rolesWithUsersRes.data) {
                    setRolesWithUsers(rolesWithUsersRes.data);
                }
            } catch (error) {
                if (!isMounted) return;
                if (axios.isAxiosError(error) && error.response?.status === 403) {
                    setErrorMessage("Bu sayfayı görüntülemek için Admin yetkisi gerekir.");
                    return;
                }
                setErrorMessage(
                    extractErrorMessage(error, "Veriler yüklenirken API bağlantısı kurulamadı."),
                );
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        void init();
        return () => {
            isMounted = false;
        };
    }, []);

    // Arama filtrelemesi
    const filteredUsers = useMemo(() => {
        if (!userSearchQuery.trim()) return users;
        const q = userSearchQuery.toLowerCase();
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.roles.some((r) => r.toLowerCase().includes(q)),
        );
    }, [users, userSearchQuery]);

    // Admin tarafından yeni birim rolü oluşturma
    async function handleCreateRole() {
        const normalizedRoleName = newRoleName.trim();
        if (!normalizedRoleName) {
            setErrorMessage("Birim rolü adı boş bırakılamaz.");
            return;
        }

        setIsCreatingRole(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await createRole(normalizedRoleName);
            if (!response.isSuccess) {
                setErrorMessage(
                    response.errors?.join(" ") ?? response.message ?? "Birim rolü oluşturulamadı.",
                );
                return;
            }

            setSuccessMessage(`"${normalizedRoleName}" birim rolü başarıyla oluşturuldu.`);
            setNewRoleName("");
            await loadData();
        } catch (error) {
            setErrorMessage(extractErrorMessage(error, "Rol oluşturulurken bir hata oluştu."));
        } finally {
            setIsCreatingRole(false);
        }
    }

    // Satır içi rol atama
    async function handleAssignRole(userId: number, roleId: number) {
        setAddRoleMenuAnchor(null);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await assignRole(userId, roleId);
            if (!response.isSuccess) {
                setErrorMessage(
                    response.errors?.join(" ") ?? response.message ?? "Rol atanamadı.",
                );
                return;
            }

            setSuccessMessage("Rol başarıyla atandı.");
            await loadData();
        } catch (error) {
            setErrorMessage(extractErrorMessage(error, "Rol atanırken bir hata oluştu."));
        }
    }

    // Rol kaldırma onaylama
    async function confirmRemoveRole() {
        if (!roleToRemove) return;
        const { userId, roleId } = roleToRemove;
        setRoleToRemove(null);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await removeRoleFromUser(userId, roleId);
            if (!response.isSuccess) {
                setErrorMessage(
                    response.errors?.join(" ") ?? response.message ?? "Rol kaldırılamadı.",
                );
                return;
            }

            setSuccessMessage("Rol kullanıcıdan başarıyla kaldırıldı.");
            await loadData();
        } catch (error) {
            setErrorMessage(extractErrorMessage(error, "Rol kaldırılırken bir hata oluştu."));
        }
    }

    // Birim akordiyonu içinden kullanıcı ekleme
    async function handleAddUserToUnit(roleId: number) {
        const selectedUser = selectedUserForUnit[roleId];
        if (!selectedUser) return;

        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await assignRole(selectedUser.id, roleId);
            if (!response.isSuccess) {
                setErrorMessage(
                    response.errors?.join(" ") ?? response.message ?? "Kullanıcı birime eklenemedi.",
                );
                return;
            }

            setSuccessMessage(`${selectedUser.name} birime başarıyla eklendi.`);
            setSelectedUserForUnit((prev) => ({ ...prev, [roleId]: null }));
            await loadData();
        } catch (error) {
            setErrorMessage(extractErrorMessage(error, "Kullanıcı birime eklenirken hata oluştu."));
        }
    }

    if (isLoading) {
        return (
            <Stack sx={{ minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Stack>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
            <BrandHeader pageTitle="Yönetici Paneli" onHome={() => navigate("/")} onLogout={handleLogout} />

            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                            Yönetici Paneli
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Kullanıcıları, birimleri ve sistem yetkilerini buradan yönetin.
                        </Typography>
                    </Box>

                    {errorMessage && (
                        <Alert severity="error" onClose={() => setErrorMessage("")}>
                            {errorMessage}
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert severity="success" onClose={() => setSuccessMessage("")}>
                            {successMessage}
                        </Alert>
                    )}

                    {/* 2 Sekmeli Yapı */}
                    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                        <Tabs
                            value={currentTab}
                            onChange={(_, val) => setCurrentTab(val)}
                            sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2 }}
                        >
                            <Tab icon={<PersonIcon />} iconPosition="start" label="Kullanıcılar" sx={{ fontWeight: 700 }} />
                            <Tab icon={<BusinessIcon />} iconPosition="start" label="Birimler" sx={{ fontWeight: 700 }} />
                        </Tabs>

                        {/* SEKME 1: KULLANICILAR */}
                        {currentTab === 0 && (
                            <Box sx={{ p: 3 }}>
                                <Stack spacing={3}>
                                    {/* Arama Çubuğu */}
                                    <TextField
                                        fullWidth
                                        placeholder="Kullanıcı adı, ad soyad, e-posta veya role göre ara..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                        size="medium"
                                    />

                                    {/* Kullanıcılar Tablosu */}
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <Table>
                                            <TableHead sx={{ backgroundColor: "grey.50" }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700 }}>Kullanıcı</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>E-posta</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Roller & Birimler</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {filteredUsers.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>
                                                            Arama kriterine uygun kullanıcı bulunamadı.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredUsers.map((user) => {
                                                        // Bu kullanıcıya atanmamış roller
                                                        const unassignedRoles = roles.filter(
                                                            (r) => !user.roles.includes(r.name),
                                                        );

                                                        return (
                                                            <TableRow key={user.id} hover>
                                                                <TableCell>
                                                                    <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        @{user.username}
                                                                    </Typography>
                                                                </TableCell>

                                                                <TableCell>{user.email}</TableCell>

                                                                <TableCell>
                                                                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                                                                        {user.roles.map((roleName) => {
                                                                            const roleObj = roles.find((r) => r.name === roleName);
                                                                            return (
                                                                                <Chip
                                                                                    key={roleName}
                                                                                    label={roleName}
                                                                                    size="small"
                                                                                    color={roleName === "Admin" ? "primary" : "default"}
                                                                                    variant={roleName === "Admin" ? "filled" : "outlined"}
                                                                                    onDelete={
                                                                                        roleObj
                                                                                            ? () =>
                                                                                                setRoleToRemove({
                                                                                                    userId: user.id,
                                                                                                    userName: user.name,
                                                                                                    roleId: roleObj.id,
                                                                                                    roleName: roleName,
                                                                                                })
                                                                                            : undefined
                                                                                    }
                                                                                />
                                                                            );
                                                                        })}

                                                                        {/* Satır içi + Rol Ekle Butonu */}
                                                                        {unassignedRoles.length > 0 && (
                                                                            <Chip
                                                                                icon={<AddIcon fontSize="small" />}
                                                                                label="Rol Ekle"
                                                                                size="small"
                                                                                color="primary"
                                                                                variant="outlined"
                                                                                onClick={(e) =>
                                                                                    setAddRoleMenuAnchor({
                                                                                        element: e.currentTarget,
                                                                                        user,
                                                                                    })
                                                                                }
                                                                                clickable
                                                                                sx={{ borderStyle: "dashed" }}
                                                                            />
                                                                        )}
                                                                    </Stack>
                                                                </TableCell>

                                                                <TableCell>
                                                                    <Chip
                                                                        label={user.isActive ? "Aktif" : "Pasif"}
                                                                        color={user.isActive ? "success" : "default"}
                                                                        size="small"
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Stack>
                            </Box>
                        )}

                        {/* SEKME 2: BİRİMLER */}
                        {currentTab === 1 && (
                            <Box sx={{ p: 3 }}>
                                <Stack spacing={3}>
                                    {/* Yeni Birim Oluşturma Kartı */}
                                    <Card variant="outlined" sx={{ borderRadius: 2, backgroundColor: "grey.50" }}>
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    Yeni Birim Rolü Oluştur
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Örn: Kariyer Merkezi, Mühendislik Fakültesi, Bilgi İşlem Daire Bşk.
                                                </Typography>

                                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                                    <TextField
                                                        fullWidth
                                                        label="Birim Rolü Adı"
                                                        value={newRoleName}
                                                        onChange={(e) => setNewRoleName(e.target.value)}
                                                        disabled={isCreatingRole}
                                                        size="small"
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        onClick={handleCreateRole}
                                                        disabled={isCreatingRole}
                                                        sx={{ minWidth: 160, fontWeight: 700 }}
                                                    >
                                                        {isCreatingRole ? "Oluşturuluyor..." : "Birim Oluştur"}
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </CardContent>
                                    </Card>

                                    {/* Birim Listesi ve Üyeleri (Akordiyon Yapısı) */}
                                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 2 }}>
                                        Tanımlı Birimler ({rolesWithUsers.length})
                                    </Typography>

                                    <Stack spacing={1.5}>
                                        {rolesWithUsers.map((unit) => (
                                            <Accordion key={unit.id} variant="outlined" sx={{ borderRadius: "8px !important", "&:before": { display: "none" } }}>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Stack direction="row" spacing={2} sx={{ alignItems: "center", width: "100%", pr: 2 }}>
                                                        <BusinessIcon color="primary" />
                                                        <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>{unit.name}</Typography>

                                                        <Chip
                                                            icon={<GroupIcon fontSize="small" />}
                                                            label={`${unit.userCount ?? unit.users?.length ?? 0} Kullanıcı Tanımlı`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </Stack>
                                                </AccordionSummary>

                                                <AccordionDetails>
                                                    <Divider sx={{ mb: 2 }} />
                                                    <Stack spacing={2}>
                                                        {/* Birim Üyesi Ekleme Seçici */}
                                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center" }}>
                                                            <Autocomplete
                                                                fullWidth
                                                                options={users.filter(
                                                                    (u) => !unit.users?.some((member) => member.id === u.id),
                                                                )}
                                                                getOptionLabel={(option) => `${option.name} (@${option.username})`}
                                                                value={selectedUserForUnit[unit.id] ?? null}
                                                                onChange={(_, val) =>
                                                                    setSelectedUserForUnit((prev) => ({
                                                                        ...prev,
                                                                        [unit.id]: val,
                                                                    }))
                                                                }
                                                                renderInput={(params) => (
                                                                    <TextField {...params} label="Bu birime üye ekle..." size="small" />
                                                                )}
                                                                noOptionsText="Eklenecek kullanıcı kalmadı"
                                                            />
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() => handleAddUserToUnit(unit.id)}
                                                                disabled={!selectedUserForUnit[unit.id]}
                                                                sx={{ minWidth: 120 }}
                                                            >
                                                                Üye Ekle
                                                            </Button>
                                                        </Stack>

                                                        {/* Mevcut Üyeler Listesi */}
                                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                                            <Table size="small">
                                                                <TableHead sx={{ backgroundColor: "grey.50" }}>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 700 }}>Üye Adı</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700 }}>Kullanıcı Adı</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700 }}>E-posta</TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>İşlem</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {(!unit.users || unit.users.length === 0) ? (
                                                                        <TableRow>
                                                                            <TableCell colSpan={4} align="center" sx={{ py: 2, color: "text.secondary" }}>
                                                                                Bu birime tanımlanmış henüz hiçbir kullanıcı yok.
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ) : (
                                                                        unit.users.map((member) => (
                                                                            <TableRow key={member.id} hover>
                                                                                <TableCell sx={{ fontWeight: 600 }}>{member.name}</TableCell>
                                                                                <TableCell color="text.secondary">@{member.username}</TableCell>
                                                                                <TableCell>{member.email}</TableCell>
                                                                                <TableCell align="right">
                                                                                    <Button
                                                                                        size="small"
                                                                                        color="error"
                                                                                        startIcon={<DeleteIcon fontSize="small" />}
                                                                                        onClick={() =>
                                                                                            setRoleToRemove({
                                                                                                userId: member.id,
                                                                                                userName: member.name,
                                                                                                roleId: unit.id,
                                                                                                roleName: unit.name,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        Birimden Çıkar
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </Stack>
                                                </AccordionDetails>
                                            </Accordion>
                                        ))}
                                    </Stack>
                                </Stack>
                            </Box>
                        )}
                    </Paper>
                </Stack>
            </Container>

            {/* Satır içi Rol Ekleme Menüsü (Select2/Popup) */}
            <Menu
                anchorEl={addRoleMenuAnchor?.element}
                open={Boolean(addRoleMenuAnchor)}
                onClose={() => setAddRoleMenuAnchor(null)}
            >
                {addRoleMenuAnchor &&
                    roles
                        .filter((r) => !addRoleMenuAnchor.user.roles.includes(r.name))
                        .map((role) => (
                            <MenuItem
                                key={role.id}
                                onClick={() => handleAssignRole(addRoleMenuAnchor.user.id, role.id)}
                            >
                                <Typography variant="body2">{role.name}</Typography>
                            </MenuItem>
                        ))}
            </Menu>

            {/* Rol / Birim Kaldırma Onay Modalı */}
            <Dialog open={Boolean(roleToRemove)} onClose={() => setRoleToRemove(null)}>
                <DialogTitle>Rolü Kaldır</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <strong>{roleToRemove?.userName}</strong> kullanıcısından <strong>{roleToRemove?.roleName}</strong> rolünü kaldırmak istediğinizden emin misiniz?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoleToRemove(null)}>İptal</Button>
                    <Button color="error" variant="contained" onClick={confirmRemoveRole}>
                        Kaldır
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}