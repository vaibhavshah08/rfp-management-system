export interface Rfp {
  id: string;
  description_raw: string;
  structured_data: {
    budget?: number;
    items?: Array<{
      name: string;
      quantity: number;
      specifications?: string;
    }>;
    quantities?: Record<string, number>;
    delivery_timeline?: string;
    payment_terms?: string;
    warranty?: string;
    category?: string;
    metadata?: Record<string, any>;
  };
  created_at: string;
  proposals?: Proposal[];
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  metadata?: Record<string, any>;
  proposals?: Proposal[];
}

export interface Proposal {
  id: string;
  vendor_id: string;
  rfp_id: string;
  raw_email: string;
  structured_proposal: {
    price?: number;
    items?: Array<{
      name: string;
      quantity: number;
      unit_price?: number;
      total_price?: number;
    }>;
    delivery_days?: number;
    warranty?: string;
    notes?: string;
    completeness?: number;
  };
  ai_summary?: string;
  score?: number;
  created_at: string;
  vendor?: Vendor;
  rfp?: Rfp;
}

export interface ComparisonResult {
  summary: string;
  scores: Record<string, {
    score: number;
    reasoning: string;
  }>;
  recommended_vendor: {
    vendor_id: string;
    reason: string;
  };
}

export interface CreateRfpDto {
  description: string;
}

export interface CreateVendorDto {
  name: string;
  email: string;
  metadata?: Record<string, any>;
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {}

export interface SendRfpDto {
  vendor_ids: string[];
}


