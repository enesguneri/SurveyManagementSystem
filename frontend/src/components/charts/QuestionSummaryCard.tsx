import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import type { QuestionAnalytics } from "../../utils/chartAnalytics";
import PieChartSummary from "./PieChartSummary";
import { ChoiceBarChart, MatrixSummaryView, RatingBarChart } from "./BarChartSummary";
import TextResponsesSummary from "./TextResponsesSummary";

interface QuestionSummaryCardProps {
    analytics: QuestionAnalytics;
    totalFormResponses: number;
}

export default function QuestionSummaryCard({
    analytics,
    totalFormResponses,
}: QuestionSummaryCardProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopyChart() {
        try {
            // Özet metni panoya kopyala
            let summaryText = `${analytics.questionTitle}\n${analytics.totalAnswers} yanıt\n\n`;

            if (analytics.choiceFrequencies.length > 0) {
                summaryText += analytics.choiceFrequencies
                    .map((c) => `• ${c.text}: ${c.count} (%${c.percentage})`)
                    .join("\n");
            } else if (analytics.averageRating !== null) {
                summaryText += `Ortalama Puan: ${analytics.averageRating} / 10\n`;
                summaryText += analytics.ratingFrequencies
                    .map((r) => `• Puan ${r.value}: ${r.count} kişi (%${r.percentage})`)
                    .join("\n");
            } else if (analytics.textAnswers.length > 0) {
                summaryText += analytics.textAnswers.map((t) => `• ${t}`).join("\n");
            }

            await navigator.clipboard.writeText(summaryText);
            setCopied(true);
        } catch {
            // fallback
            setCopied(true);
        }
    }

    const isChoiceType =
        analytics.questionType === "SingleChoice" ||
        analytics.questionType === "Dropdown";

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
        >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack spacing={2}>
                    {/* 📌 Üst Başlık ve "Grafiği Kopyala" Butonu (Google Forms Tasarımı) */}
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: "text.primary",
                                    fontSize: "1.1rem",
                                }}
                            >
                                {analytics.questionTitle}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.25 }}
                            >
                                {analytics.totalAnswers} yanıt
                            </Typography>
                        </Box>

                        <Button
                            size="small"
                            variant="text"
                            onClick={handleCopyChart}
                            startIcon={copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                            sx={{
                                textTransform: "none",
                                color: copied ? "success.main" : "primary.main",
                                fontWeight: 600,
                                flexShrink: 0,
                                "&:hover": {
                                    backgroundColor: "rgba(25, 118, 210, 0.04)",
                                },
                            }}
                        >
                            {copied ? "Kopyalandı" : "Grafiği kopyala"}
                        </Button>
                    </Stack>

                    <Divider />

                    {/* 📊 Grafik ve Veri Gösterimi */}
                    <Box sx={{ pt: 1 }}>
                        {isChoiceType && (
                            <PieChartSummary
                                frequencies={analytics.choiceFrequencies}
                            />
                        )}

                        {analytics.questionType === "MultipleChoice" && (
                            <ChoiceBarChart
                                frequencies={analytics.choiceFrequencies}
                                totalResponses={totalFormResponses}
                            />
                        )}

                        {analytics.questionType === "Rating" && (
                            <RatingBarChart
                                frequencies={analytics.ratingFrequencies}
                                averageRating={analytics.averageRating}
                            />
                        )}

                        {(analytics.questionType === "MultipleChoiceGrid" ||
                            analytics.questionType === "CheckboxGrid") && (
                            <MatrixSummaryView
                                matrixSummaries={analytics.matrixSummaries}
                            />
                        )}

                        {(analytics.questionType === "ShortText" ||
                            analytics.questionType === "LongText" ||
                            analytics.questionType === "Date") && (
                            <TextResponsesSummary
                                textAnswers={analytics.textAnswers}
                            />
                        )}
                    </Box>
                </Stack>
            </CardContent>

            <Snackbar
                open={copied}
                autoHideDuration={2000}
                onClose={() => setCopied(false)}
                message="Grafik ve yanıt özeti panoya kopyalandı."
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Card>
    );
}
