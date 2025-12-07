import { z } from 'zod';

export const RfpStructureSchema = z.object({
  budget: z.number().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      specifications: z.string().nullable().optional(),
    }),
  ),
  quantities: z.record(z.string(), z.number()),
  delivery_timeline: z.string().nullable(),
  payment_terms: z.string().nullable(),
  warranty: z.string().nullable(),
  category: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
});

export const ProposalStructureSchema = z.object({
  price: z.number().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit_price: z.number().nullable().optional(),
      total_price: z.number().nullable().optional(),
    }),
  ),
  delivery_days: z.number().nullable(),
  warranty: z.string().nullable(),
  notes: z.string().nullable(),
  completeness: z.number().min(0).max(100),
});

export const ComparisonResultSchema = z.object({
  summary: z.string(),
  scores: z.record(
    z.string(),
    z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
  ),
  recommended_vendor: z.object({
    vendor_id: z.string(),
    reason: z.string(),
  }),
});

export type RfpStructure = z.infer<typeof RfpStructureSchema>;
export type ProposalStructure = z.infer<typeof ProposalStructureSchema>;
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;
