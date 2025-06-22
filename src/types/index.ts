
export interface GraphNode {
  id: string;
  type: 'account' | 'merchant' | 'ip_address' | 'device' | 'user' | string; 
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string; 
  target: string; 
  type: 'transaction' | 'shared_ip' | 'used_device' | 'uses_payment_method' | 'uses_ip' | 'uses_device' | string; 
  amount?: number;
  timestamp?: string;
  properties?: Record<string, any>;
}

export interface TransactionGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RiskAssessment {
  riskScore: number; // 0 to 1
  riskFactors: string[];
  summary: string;
  isHighRisk: boolean;
  fraudProofHash?: string; 
}

export interface UpiAnalysisResponse {
  analysisMessage: string;
  isWarning: boolean;
}

export interface ApiError {
  message: string;
  details?: any;
}

export interface PaymentDetails {
  userId: string;
  merchantName: string;
  merchantId: string; 
  amount: number;
  currency: string;
  paymentMethod: string; 
  deviceId: string;
  ipAddress: string;
  timestamp: string;
}

// Types for Cart and Checkout
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  dataAiHint?: string; // For placeholder image generation
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Types for AI Payment Suggestion
export interface PaymentMethodDetail {
  id: string;
  name: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  // Potentially add offer details here if the model becomes more complex
}

// Types for Offline Sync
export interface QueuedPayment {
  id: string; // UUID or timestamp-based
  recipient: string;
  amount: number;
  currency: string;
  timestamp: string; // ISO string for when it was queued
  numericTimestamp: number; // numeric timestamp for display like in image
  status: 'pending' | 'syncing' | 'failed';
  hash: string; // SHA-256 hash of payment data (excluding its own hash, including previousHash)
  previousHash: string; // Hash of the previous payment in the DAG
}

export interface PaymentHistoryItem {
  id: string;
  recipient: string;
  amount: number;
  currency: string;
  timestamp: string; // ISO string for when it was originally queued
  numericTimestamp: number; 
  status: 'Synced' | 'Completed' | 'Failed Sync' | 'Cancelled' | 'Cancelled (Expired)'; // More specific statuses
  hash: string;
  previousHash: string;
  syncedAt?: string; // ISO string for when it was synced
  cancelledAt?: string; // ISO string for when it was auto-cancelled
}

export interface OfflineSyncData {
  queue: QueuedPayment[];
  merkleRoot: string | null; // Merkle root of the current queue
  lastHistoryHash: string | null; // Hash of the last item in the synced history
}

