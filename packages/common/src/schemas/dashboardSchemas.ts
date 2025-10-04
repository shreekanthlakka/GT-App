import { z } from "zod";

export const DashboardStatsSchema = z.object({
    period: z.enum(["1d", "7d", "30d", "90d"]).optional().default("7d"),
});

export const ChannelPerformanceSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export const CostAnalyticsSchema = z.object({
    period: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
});

export const FailureAnalysisSchema = z.object({
    days: z.string().transform(Number).optional().default(30),
});

export const DeliveryTrendsSchema = z.object({
    days: z.string().transform(Number).optional().default(30),
    groupBy: z.enum(["day", "week", "month"]).optional().default("day"),
});

export const RecentActivitySchema = z.object({
    limit: z.string().transform(Number).optional().default(20),
});

export const TopTemplatesSchema = z.object({
    period: z.enum(["7d", "30d", "90d"]).optional().default("30d"),
    limit: z.string().transform(Number).optional().default(10),
});

export type DashboardStatsType = z.infer<typeof DashboardStatsSchema>;
export type ChannelPerformanceType = z.infer<typeof ChannelPerformanceSchema>;
export type CostAnalyticsType = z.infer<typeof CostAnalyticsSchema>;
export type FailureAnalysisType = z.infer<typeof FailureAnalysisSchema>;
export type DeliveryTrendsType = z.infer<typeof DeliveryTrendsSchema>;
export type RecentActivityType = z.infer<typeof RecentActivitySchema>;
export type TopTemplatesType = z.infer<typeof TopTemplatesSchema>;
