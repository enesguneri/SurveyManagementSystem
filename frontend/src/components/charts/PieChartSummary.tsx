import { useMemo, useState } from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { ChoiceFrequency } from "../../utils/chartAnalytics";

interface PieChartSummaryProps {
    frequencies: ChoiceFrequency[];
}

export default function PieChartSummary({ frequencies }: PieChartSummaryProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const total = frequencies.reduce((sum, item) => sum + item.count, 0);

    const size = 240;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 95;

    // Tek seçenek varsa tam daire çiz
    const isSingleOption = frequencies.filter((f) => f.count > 0).length === 1;

    // Dilim koordinatlarını saf şekilde hesapla
    const slices = useMemo(() => {
        if (total === 0) return [];

        let currentAngle = -Math.PI / 2; // 12 yönünden başla

        return frequencies.map((item, index) => {
            if (item.count === 0) {
                return null;
            }

            const sliceAngle = (item.count / total) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            currentAngle = endAngle;

            // Dilim orta açısı (yüzde yazısı için)
            const midAngle = startAngle + sliceAngle / 2;
            const labelRadius = radius * 0.65;
            const labelX = cx + labelRadius * Math.cos(midAngle);
            const labelY = cy + labelRadius * Math.sin(midAngle);

            // Yay başlangıç ve bitiş noktaları
            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);

            const isLargeArc = sliceAngle > Math.PI ? 1 : 0;

            const pathData = isSingleOption
                ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} Z`
                : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${isLargeArc} 1 ${x2} ${y2} Z`;

            const formattedPercentage = item.percentage.toLocaleString("tr-TR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            }) + "%";

            return {
                index,
                item,
                pathData,
                labelX,
                labelY,
                formattedPercentage,
                showLabel: item.percentage >= 6, // %6'dan büyük dilimlerde dilim içi yaz
            };
        }).filter(Boolean);
    }, [frequencies, total, isSingleOption, cx, cy, radius]);

    if (total === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                Henüz yanıt verilmemiş.
            </Typography>
        );
    }

    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={4}
            sx={{
                width: "100%",
                py: 1,
                alignItems: "center",
                justifyContent: "space-around",
            }}
        >
            {/* 🥧 SVG Pie Chart */}
            <Box
                sx={{
                    width: size,
                    height: size,
                    position: "relative",
                    flexShrink: 0,
                }}
            >
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    style={{ overflow: "visible" }}
                >
                    {slices.map((slice) => {
                        if (!slice) return null;
                        const isHovered = hoveredIndex === slice.index;

                        return (
                            <Tooltip
                                key={slice.index}
                                title={`${slice.item.text}: ${slice.item.count} yanıt (%${slice.item.percentage})`}
                                arrow
                            >
                                <g
                                    onMouseEnter={() => setHoveredIndex(slice.index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <path
                                        d={slice.pathData}
                                        fill={slice.item.color}
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                        style={{
                                            transition: "transform 0.18s ease, filter 0.18s ease",
                                            transformOrigin: `${cx}px ${cy}px`,
                                            transform: isHovered ? "scale(1.04)" : "scale(1)",
                                            filter: isHovered
                                                ? "drop-shadow(0px 3px 6px rgba(0,0,0,0.25))"
                                                : "none",
                                        }}
                                    />
                                    {slice.showLabel && (
                                        <text
                                            x={slice.labelX}
                                            y={slice.labelY + 4}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="12px"
                                            fontWeight="700"
                                            style={{
                                                pointerEvents: "none",
                                                textShadow: "0px 1px 2px rgba(0,0,0,0.5)",
                                            }}
                                        >
                                            {slice.formattedPercentage}
                                        </text>
                                    )}
                                </g>
                            </Tooltip>
                        );
                    })}
                </svg>
            </Box>

            {/* 🏷️ Sağ Lejant (Legend) */}
            <Stack spacing={1.5} sx={{ minWidth: 200, maxWidth: { xs: "100%", sm: 320 } }}>
                {frequencies.map((item, index) => {
                    const isHovered = hoveredIndex === index;

                    return (
                        <Stack
                            key={item.text}
                            direction="row"
                            spacing={1.5}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            sx={{
                                cursor: "pointer",
                                p: 0.5,
                                borderRadius: 1,
                                alignItems: "center",
                                backgroundColor: isHovered ? "action.hover" : "transparent",
                                transition: "background-color 0.15s ease",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    backgroundColor: item.color,
                                    flexShrink: 0,
                                }}
                            />
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: isHovered ? 600 : 400,
                                    flexGrow: 1,
                                    wordBreak: "break-word",
                                }}
                            >
                                {item.text}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: 600, flexShrink: 0 }}
                            >
                                {item.count} (%{item.percentage})
                            </Typography>
                        </Stack>
                    );
                })}
            </Stack>
        </Stack>
    );
}
