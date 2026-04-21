export type UserRole = "admin" | "shop" | "customer";

export interface LocalinkUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  shopId?: string; // Only for "shop" role
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  bannerUrl?: string;
  imageUrl?: string;
  category?: string;
  ownerId: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface Employee {
  id: string;
  shopId: string;
  name: string;
  role: string;
  email: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  day: string; // e.g., "Monday"
  startTime: string; // "HH:mm"
  endTime: string;
}

export interface CartItem extends Product {
  quantity: number;
  shopName: string;
}
