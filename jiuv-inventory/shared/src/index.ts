/**
 * 九维进销存 — 共享类型定义
 * 沿用 JBM Beer/Keg/Tap 三层数据模型
 */

// ============ 枚举（union type，兼容 Prisma 字符串） ============

export type CupSize = 'LARGE' | 'MEDIUM';       // 大杯 500ml / 中杯 350ml
export type UserRole = 'OWNER' | 'STAFF';
export type OrderStatus = 'COMPLETED' | 'REFUNDED';
export type PurchaseStatus = 'PENDING' | 'RECEIVED';
export type TapStatus = 'ACTIVE' | 'INACTIVE';

// ============ Beer ============

export interface Beer {
  id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;        // 酒精度 %
  plato: number;      // 原麦汁浓度 °P
  ibu: number;        // 苦度
  priceLarge: number;  // 大杯价格（整数分）
  priceMedium: number; // 中杯价格（整数分）
  description: string | null;
  imageKey: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBeerInput {
  name: string;
  brewery: string;
  style: string;
  abv: number;
  plato: number;
  ibu: number;
  priceLarge: number;
  priceMedium: number;
  description?: string;
}

export interface UpdateBeerInput {
  name?: string;
  brewery?: string;
  style?: string;
  abv?: number;
  plato?: number;
  ibu?: number;
  priceLarge?: number;
  priceMedium?: number;
  description?: string;
  isActive?: boolean;
}

// ============ Keg ============

export interface Keg {
  id: string;
  beerId: string;
  beer?: Beer;
  batchNo: string;
  volumeLiters: number;       // 当前剩余升数
  initialVolumeLiters: number; // 初始升数
  costCents: number;          // 成本（整数分）
  supplierId: string | null;
  tapId: number | null;       // 映射龙头 1-11
  receivedAt: string;
  isEmpty: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKegInput {
  beerId: string;
  batchNo: string;
  volumeLiters: number;
  costCents: number;
  supplierId?: string;
  tapId?: number;
}

// ============ Tap ============

export interface Tap {
  id: number;            // 1-11
  kegId: string | null;
  keg?: Keg | null;
  beer?: Beer | null;
  status: TapStatus;
  updatedAt: string;
}

// ============ Supplier ============

export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============ PurchaseOrder ============

export interface PurchaseOrder {
  id: string;
  supplierId: string | null;
  supplier?: Supplier | null;
  status: PurchaseStatus;
  totalCostCents: number;
  items: PurchaseOrderItem[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  beerId: string;
  beer?: Beer;
  batchNo: string;
  volumeLiters: number;
  costCents: number;
  kegId: string | null;
}

// ============ SaleOrder ============

export interface SaleOrder {
  id: string;
  orderNo: string;
  status: OrderStatus;
  totalCents: number;
  items: SaleOrderItem[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleOrderItem {
  id: string;
  orderId: string;
  beerId: string;
  beer?: Beer;
  cupSize: CupSize;
  volumeMl: number;     // 杯容量 ml
  priceCents: number;   // 单价（整数分）
  quantity: number;
  subtotalCents: number;
}

// ============ User ============

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============ API 通用响应 ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============ 统计 ============

export interface SalesStats {
  totalRevenueCents: number;
  totalOrders: number;
  totalVolumeMl: number;
  topBeers: {
    beerId: string;
    beerName: string;
    quantity: number;
    revenueCents: number;
  }[];
  byDay: {
    date: string;
    revenueCents: number;
    orders: number;
  }[];
}

// ============ 工具函数 ============

/** 分转元 */
export function centsToYuan(cents: number): number {
  return cents / 100;
}

/** 元转分 */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

/** 杯容量映射 */
export const CUP_SIZE_ML: Record<CupSize, number> = {
  LARGE: 500,
  MEDIUM: 350,
};

/** 龙头数量 */
export const MAX_TAPS = 11;

/** 库存预警阈值（升） */
export const LOW_STOCK_THRESHOLD_LITERS = 2;
