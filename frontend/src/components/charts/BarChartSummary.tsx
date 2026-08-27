import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import type { ChoiceFrequency, MatrixRowSummary, RatingFrequency } from "../../utils/chartAnalytics";

interface ChoiceBarChartProps {
    frequencies: ChoiceFrequency[];
    totalResponses: number;
}

export function ChoiceBarChart({ frequencies, totalResponses }: ChoiceBarChartProps) {
    const maxCount = Math.max(...frequencies.map((f) => f.count), 1);

    return (
        <Stack spacing={2} sx={{ width: "100%", py: 1 }}>
            {frequencies.map((item) => {
                const barProgress = (item.count / maxCount) * 100;
                const responsePercentage = totalResponses > 0
                    ? ((item.count / totalResponses) * 100).toFixed(1)
                    : "0";

                return (
                    <Box key={item.text}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.text}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {item.count} yanıt (%{responsePercentage})
                            </Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={barProgress}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: "rgba(0,0,0,0.06)",
                                "& .MuiLinearProgress-bar": {
                                    backgroundColor: item.color,
                                    borderRadius: 5,
                                },
                            }}
                        />
                    </Box>
                );
            })}
        </Stack>
    );
}

interface RatingBarChartProps {
    frequencies: RatingFrequency[];
    averageRating: number | null;
}

export function RatingBarChart({ frequencies, averageRating }: RatingBarChartProps) {
    const maxCount = Math.max(...frequencies.map((f) => f.count), 1);

    return (
        <Stack spacing={2} sx={{ width: "100%", py: 1 }}>
            {averageRating !== null && (
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "rgba(66, 133, 244, 0.08)",
                        border: "1px solid rgba(66, 133, 244, 0.2)",
                        display: "inline-block",
                        width: "fit-content",
                    }}
                >
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                        Ortalama Puan
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#1976D2" }}>
                        {averageRating} <Typography component="span" variant="body2" color="text.secondary">/ 10</Typography>
                    </Typography>
                </Box>
            )}

            <Stack spacing={1.5}>
                {frequencies.map((item) => {
                    const barProgress = (item.count / maxCount) * 100;

                    return (
                        <Box key={item.value}>
                            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Puan {item.value}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {item.count} kişi (%{item.percentage})
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={barProgress}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: "rgba(0,0,0,0.06)",
                                    "& .MuiLinearProgress-bar": {
                                        backgroundColor: "#4285F4",
                                        borderRadius: 5,
                                    },
                                }}
                            />
                        </Box>
                    );
                })}
            </Stack>
        </Stack>
    );
}

interface MatrixSummaryProps {
    matrixSummaries: MatrixRowSummary[];
}

export function MatrixSummaryView({ matrixSummaries }: MatrixSummaryProps) {
    return (
        <Stack spacing={2} sx={{ width: "100%", py: 1 }}>
            {matrixSummaries.map((row) => (
                <Box key={row.rowText} sx={{ p: 1.5, borderRadius: 1, backgroundColor: "background.default" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        {row.rowText}
                    </Typography>
                    <Stack spacing={0.5}>
                        {row.columnCounts.map((col) => (
                            <Stack key={col.columnText} direction="row" sx={{ justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    • {col.columnText}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {col.count} seçim
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            ))}
        </Stack>
    );
}
