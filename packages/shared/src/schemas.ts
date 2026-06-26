import { z } from 'zod';

/**
 * Validation schemas shared by the API (request validation) and the web client
 * (form validation), so a payload that passes on the client is the same shape
 * the server enforces.
 */

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color like #6366f1');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  description: z.string().trim().max(500).optional(),
  color: hexColor.optional(),
  isPublic: z.boolean().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const createBookmarkSchema = z.object({
  collectionId: z.string().min(1),
  url: z.string().trim().url('Enter a valid URL'),
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const updateBookmarkSchema = z.object({
  url: z.string().trim().url('Enter a valid URL').optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(40),
  color: hexColor.optional(),
});

export const createShareSchema = z.object({
  expiresAt: z.string().datetime().optional(),
});

/** A single bookmark entry accepted by the JSON import endpoint. */
export const importBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(40)).optional(),
});

export const importSchema = z.object({
  collectionId: z.string().min(1).optional(),
  collectionName: z.string().trim().max(80).optional(),
  bookmarks: z.array(importBookmarkSchema).min(1).max(1000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type ImportInput = z.infer<typeof importSchema>;
