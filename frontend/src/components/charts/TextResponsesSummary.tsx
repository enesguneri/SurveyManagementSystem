import { Box, Chip, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";

interface TextResponsesSummaryProps {
    textAnswers: string[];
}

export default function TextResponsesSummary({ textAnswers }: TextResponsesSummaryProps) {
    if (textAnswers.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                Henüz yazılı bir yanıt verilmemiş.
            </Typography>
        );
    }

    return (
        <Stack spacing={1.5} sx={{ width: "100%", py: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Chip label={`${textAnswers.length} yazılı yanıt`} size="small" color="primary" variant="outlined" />
            </Stack>

            <Paper variant="outlined" sx={{ maxHeight: 280, overflowY: "auto", p: 1, backgroundColor: "rgba(0,0,0,0.01)" }}>
                <List dense disablePadding>
                    {textAnswers.map((answer, index) => (
                        <ListItem
                            key={index}
                            sx={{
                                borderBottom: index < textAnswers.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                                py: 1,
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box component="span" sx={{ wordBreak: "break-word" }}>
                                        {answer}
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Stack>
    );
}
