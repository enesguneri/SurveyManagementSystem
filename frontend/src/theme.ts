import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
    palette: {
        primary: {
            main: "#007c83",
            dark: "#005b61",
            light: "#57b9b5",
        },
        secondary: {
            main: "#e08a5d",
        },
        background: {
            default: "#f3f7f8",
            paper: "#ffffff",
        },
        text: {
            primary: "#173042",
            secondary: "#64748b",
        },
    },

    shape: {
        borderRadius: 12,
    },

    typography: {
        fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 700,
        },
    },

    components: {
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    textTransform: "none",
                    fontWeight: 600,
                    minHeight: 42,
                },
            },
        },

        MuiTextField: {
            defaultProps: {
                fullWidth: true,
            },
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: "1px solid rgba(15, 118, 110, 0.10)",
                    boxShadow: "0 14px 36px rgba(20, 57, 70, 0.08)",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});