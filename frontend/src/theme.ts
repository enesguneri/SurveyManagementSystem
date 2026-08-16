import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
    palette: {
        primary: {
            main: "#006d77",
        },
        secondary: {
            main: "#e29578",
        },
        background: {
            default: "#f5f7fa",
            paper: "#ffffff",
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
                },
            },
        },
    },
});