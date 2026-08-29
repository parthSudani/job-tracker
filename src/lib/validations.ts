import { z } from "zod";
import { MAX_DAILY_APPLICATIONS, PRIORITIES } from "./constants";

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in yyyy-MM-dd format");

export const applicationCountSchema = z
  .number({ error: "Enter a number" })
  .int("Applications must be a whole number")
  .min(0, "Applications can't be negative")
  .max(MAX_DAILY_APPLICATIONS, `That's more than ${MAX_DAILY_APPLICATIONS} in a day — double-check the number`);

export const upsertRecordSchema = z.object({
  platformId: z.string().min(1),
  date: dateKeySchema,
  applicationCount: applicationCountSchema,
  notes: z.string().max(2000).optional().nullable(),
});
export type UpsertRecordInput = z.infer<typeof upsertRecordSchema>;

export const bulkUpsertSchema = z.object({
  date: dateKeySchema,
  entries: z.array(
    z.object({
      platformId: z.string().min(1),
      applicationCount: applicationCountSchema,
    })
  ),
});
export type BulkUpsertInput = z.infer<typeof bulkUpsertSchema>;

export const platformFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  officialUrl: z
    .union([z.string().url("Enter a valid URL"), z.literal("")])
    .optional()
    .nullable(),
  category: z.string().min(1),
  description: z.string().max(500).optional().default(""),
  priority: z.enum(PRIORITIES),
  recommendedFrequency: z.string().max(60).optional().default("As needed"),
  notes: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional().default(true),
});
export type PlatformFormInput = z.infer<typeof platformFormSchema>;

export const settingsFormSchema = z.object({
  dailyTarget: z.number().int().min(1).max(1000),
  monthlyTarget: z.number().int().min(1).max(20000),
  timezone: z.string().min(1),
  dateFormat: z.string().min(1),
  theme: z.enum(["system", "light", "dark"]),
  defaultDashboardRange: z.string().min(1),
});
export type SettingsFormInput = z.infer<typeof settingsFormSchema>;
