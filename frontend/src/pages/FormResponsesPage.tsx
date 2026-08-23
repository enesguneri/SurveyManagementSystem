import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Divider,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import { getFormResponses } from "../api/formApi";
import type {
    FormResponseItem,
    FormResponses,
    ResponseAnswerDetails,
} from "../types/response";

function ResponseAnswer({
                            answer,
                        }: {
    answer: ResponseAnswerDetails;
}) {
    return (
        <Stack spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>
                {answer.questionTitle}
            </Typography>

            {answer.textValue && (
                <Typography>
                    {answer.textValue}
                </Typography>
            )}

            {answer.numericValue !== null && (
                <Typography>
                    Puan: {answer.numericValue}
                </Typography>
            )}

            {answer.dateValue && (
                <Typography>
                    Tarih: {answer.dateValue}
                </Typography>
            )}

            {answer.selectedOptions.length > 0 && (
                <Stack spacing={0.5}>
                    {answer.selectedOptions.map((option) => (
                        <Typography key={option.id}>
                            • {option.text}
                        </Typography>
                    ))}
                </Stack>
            )}

            {answer.matrixSelections.length > 0 && (
                <Stack spacing={0.5}>
                    {answer.matrixSelections.map((selection) => (
                        <Typography
                            key={`${selection.matrixRowId}-${selection.matrixColumnId}`}
                        >
                            • {selection.matrixRowText}:{" "}
                            {selection.matrixColumnText}
                        </Typography>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

function ResponseCard({
                          response,
                          showRespondentIdentity,
                      }: {
    response: FormResponseItem;
    showRespondentIdentity: boolean;
}) {
    return (
        <Card>
            <CardContent>
                <Stack spacing={2}>
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{ fontWeight: 700 }}
                        >
                            {showRespondentIdentity &&
                            response.respondentName
                                ? response.respondentName
                                : "Anonim yanıt"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Gönderilme zamanı:{" "}
                            {new Date(
                                response.submittedAt,
                            ).toLocaleString("tr-TR")}
                        </Typography>
                    </Box>

                    <Divider />

                    {response.answers.map((answer) => (
                        <ResponseAnswer
                            key={answer.questionId}
                            answer={answer}
                        />
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}

export default function FormResponsesPage() {
    const navigate = useNavigate();
    const { publicId } = useParams<{
        publicId?: string;
    }>();

    const [formResponses, setFormResponses] =
        useState<FormResponses | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!publicId) {
            setErrorMessage("Form kimliği bulunamadı.");
            setIsLoading(false);
            return;
        }

        async function loadResponses() {
            try {
                const response = await getFormResponses(
                    publicId as string,
                );

                if (!response.isSuccess || !response.data) {
                    setErrorMessage(
                        response.errors?.join(" ") ??
                        response.message ??
                        "Yanıtlar yüklenemedi.",
                    );
                    return;
                }

                setFormResponses(response.data);
            } catch (error) {
                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 403
                ) {
                    setErrorMessage(
                        "Bu formun yanıtlarını görüntüleme yetkiniz yok.",
                    );
                    return;
                }

                setErrorMessage(
                    "Yanıtlar yüklenirken API bağlantısı kurulamadı.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadResponses();
    }, [publicId]);

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

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "background.default",
            }}
        >
            <Toolbar
                sx={{
                    justifyContent: "space-between",
                    backgroundColor: "white",
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Form Yanıtları
                </Typography>

                <Button
                    variant="outlined"
                    onClick={() => navigate("/forms")}
                >
                    Formlara Dön
                </Button>
            </Toolbar>

            <Container maxWidth="md" sx={{ py: 5 }}>
                <Stack spacing={3}>
                    {errorMessage && (
                        <Alert severity="error">
                            {errorMessage}
                        </Alert>
                    )}

                    {formResponses && (
                        <>
                            <Box>
                                <Typography
                                    variant="h4"
                                    component="h1"
                                >
                                    {formResponses.title}
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    Toplam yanıt:{" "}
                                    {formResponses.responses.length}
                                </Typography>
                            </Box>

                            {formResponses.responses.length === 0 && (
                                <Alert severity="info">
                                    Bu forma henüz yanıt gönderilmemiş.
                                </Alert>
                            )}

                            {formResponses.responses.map((response) => (
                                <ResponseCard
                                    key={response.id}
                                    response={response}
                                    showRespondentIdentity={
                                        formResponses.showRespondentIdentity
                                    }
                                />
                            ))}
                        </>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}