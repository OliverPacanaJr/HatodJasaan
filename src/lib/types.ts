export type UserRole = 'customer' | 'business' | 'rider' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup'
  | 'rider_assigned' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled';
export type PaymentMode = 'cash' | 'gcash' | 'maya';
export type DocumentType =
  | 'government_id' | 'barangay_clearance' | 'business_permit'
  | 'drivers_license' | 'motorcycle_photo' | 'selfie'
  | 'store_photo' | 'residency_proof' | 'other';
export type BusinessType =
  | 'carinderia' | 'restaurant' | 'lechon_manok' | 'bakery'
  | 'grocery' | 'water_station' | 'pharmacy' | 'other';
export type NotificationType =
  | 'order_update' | 'approval_update' | 'new_order'
  | 'delivery_request' | 'system' | 'promotion' | 'review';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: ApprovalStatus;
  address: string | null;
  barangay: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string | null;
  verified: boolean;
  notes: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  business_type: BusinessType;
  phone: string | null;
  email: string | null;
  address: string;
  barangay: string | null;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
  cover_url: string | null;
  status: ApprovalStatus;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
  min_order_amount: number;
  avg_prep_time_mins: number;
  payment_modes: PaymentMode[];
  rating: number;
  total_ratings: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessDocument {
  id: string;
  business_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string | null;
  verified: boolean;
  notes: string | null;
  created_at: string;
}

export interface RiderProfile {
  id: string;
  user_id: string;
  license_number: string | null;
  motorcycle_model: string | null;
  motorcycle_plate: string | null;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  total_deliveries: number;
  total_earnings: number;
  rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  business_id: string;
  rider_id: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_mode: PaymentMode;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  customer_notes: string | null;
  business_notes: string | null;
  rider_notes: string | null;
  estimated_delivery_mins: number | null;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  business_id: string;
  rider_id: string | null;
  business_rating: number;
  rider_rating: number | null;
  comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export interface Cart {
  businessId: string;
  businessName: string;
  items: CartItem[];
}

export interface OrderWithDetails extends Order {
  items: (OrderItem & { menu_item?: MenuItem })[];
  business?: Business;
  customer?: Profile;
  rider?: Profile;
  review?: Review;
}

export interface BusinessWithOwner extends Business {
  owner?: Profile;
  documents?: BusinessDocument[];
}

export interface RiderWithProfile extends RiderProfile {
  profile?: Profile;
  documents?: UserDocument[];
}
