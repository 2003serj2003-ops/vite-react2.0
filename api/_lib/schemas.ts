import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  telegram_id: z.number().nullable(),
  email: z.string().email().nullable(),
  full_name: z.string().nullable(),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  last_login_at: z.string().nullable(),
});

export const CreateUserSchema = z.object({
  telegram_id: z.number().optional(),
  email: z.string().email().optional(),
  full_name: z.string().min(1).max(100),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']).default('viewer'),
});

export const UpdateUserSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']).optional(),
  is_active: z.boolean().optional(),
});

// Access Code schemas
export const AccessCodeSchema = z.object({
  id: z.string().uuid(),
  role_to_assign: z.enum(['owner', 'admin', 'editor', 'viewer']),
  max_uses: z.number().nullable(),
  uses_count: z.number(),
  expires_at: z.string().nullable(),
  is_disabled: z.boolean(),
  created_at: z.string(),
  note: z.string().nullable(),
});

export const CreateAccessCodeSchema = z.object({
  role_to_assign: z.enum(['owner', 'admin', 'editor', 'viewer']),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export const VerifyAccessCodeSchema = z.object({
  code: z.string().min(6).max(50),
  telegram_id: z.number().optional(),
  full_name: z.string().min(1).max(100).optional(),
});

// Content schemas
export const SectionSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  title_ru: z.string(),
  title_uz: z.string(),
  icon: z.string(),
  sort: z.number(),
});

export const CreateSectionSchema = z.object({
  key: z.string().min(1).max(50),
  title_ru: z.string().min(1).max(200),
  title_uz: z.string().min(1).max(200),
  icon: z.string().max(10),
  sort: z.number().int(),
});

export const CardSchema = z.object({
  id: z.string().uuid(),
  section_id: z.string().uuid(),
  title_ru: z.string(),
  title_uz: z.string(),
  body_ru: z.string(),
  body_uz: z.string(),
  sort: z.number(),
  file_url: z.string().nullable(),
  map_url: z.string().nullable(),
});

export const CreateCardSchema = z.object({
  section_id: z.string().uuid(),
  title_ru: z.string().min(1).max(500),
  title_uz: z.string().min(1).max(500),
  body_ru: z.string().min(1).max(50000),
  body_uz: z.string().min(1).max(50000),
  sort: z.number().int(),
  file_url: z.string().url().nullable().optional(),
  map_url: z.string().url().nullable().optional(),
});

export const NewsSchema = z.object({
  id: z.string().uuid(),
  title_ru: z.string(),
  title_uz: z.string(),
  body_ru: z.string(),
  body_uz: z.string(),
  published_at: z.string(),
  pinned: z.boolean(),
  image_url: z.string().nullable(),
});

export const CreateNewsSchema = z.object({
  title_ru: z.string().min(1).max(500),
  title_uz: z.string().min(1).max(500),
  body_ru: z.string().min(1).max(50000),
  body_uz: z.string().min(1).max(50000),
  published_at: z.string().datetime(),
  pinned: z.boolean().default(false),
  image_url: z.string().url().nullable().optional(),
});

export const FaqSchema = z.object({
  id: z.string().uuid(),
  question_ru: z.string(),
  question_uz: z.string(),
  answer_ru: z.string(),
  answer_uz: z.string(),
  sort: z.number(),
});

export const CreateFaqSchema = z.object({
  question_ru: z.string().min(1).max(500),
  question_uz: z.string().min(1).max(500),
  answer_ru: z.string().min(1).max(10000),
  answer_uz: z.string().min(1).max(10000),
  sort: z.number().int(),
});

// Audit Log schemas
export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().uuid().nullable(),
  details: z.record(z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string(),
});

export const CreateAuditLogSchema = z.object({
  action: z.string().min(1).max(50),
  resource_type: z.string().min(1).max(50),
  resource_id: z.string().uuid().nullable().optional(),
  details: z.record(z.any()).optional(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type AccessCode = z.infer<typeof AccessCodeSchema>;
export type CreateAccessCode = z.infer<typeof CreateAccessCodeSchema>;
export type VerifyAccessCode = z.infer<typeof VerifyAccessCodeSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type CreateSection = z.infer<typeof CreateSectionSchema>;
export type Card = z.infer<typeof CardSchema>;
export type CreateCard = z.infer<typeof CreateCardSchema>;
export type News = z.infer<typeof NewsSchema>;
export type CreateNews = z.infer<typeof CreateNewsSchema>;
export type Faq = z.infer<typeof FaqSchema>;
export type CreateFaq = z.infer<typeof CreateFaqSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>;
