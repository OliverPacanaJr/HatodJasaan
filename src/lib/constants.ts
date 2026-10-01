export const APP_NAME = 'HatodJasaan';
export const APP_DESCRIPTION = 'Local food & goods delivery platform for Jasaan, Misamis Oriental';
export const APP_TAGLINE = 'Ihatod sa imong pultahan!';

export const BARANGAYS = [
  'Aplaya', 'Bobontugan', 'Corrales', 'Danao', 'Jampason',
  'Kimaya', 'Lower Jasaan', 'Luz Banzon', 'Natubo', 'San Antonio',
  'San Isidro', 'San Nicolas', 'Solana', 'Upper Jasaan',
  'I.S. Cruz', 'Katipunan', 'Providencia', 'Santa Cruz',
] as const;

export const BUSINESS_TYPES = [
  { value: 'carinderia', label: 'Carinderia / Karinderya' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'lechon_manok', label: 'Lechon Manok' },
  { value: 'bakery', label: 'Bakery / Panaderya' },
  { value: 'grocery', label: 'Grocery / Tindahan' },
  { value: 'water_station', label: 'Water Refilling Station' },
  { value: 'pharmacy', label: 'Pharmacy / Botika' },
  { value: 'other', label: 'Other' },
] as const;

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash on Delivery' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
] as const;

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', description: 'Waiting for business to confirm' },
  { value: 'confirmed', label: 'Confirmed', description: 'Business has accepted your order' },
  { value: 'preparing', label: 'Preparing', description: 'Your food is being prepared' },
  { value: 'ready_for_pickup', label: 'Ready', description: 'Order is ready for pickup' },
  { value: 'rider_assigned', label: 'Rider Assigned', description: 'A rider is on the way to pick up' },
  { value: 'picked_up', label: 'Picked Up', description: 'Rider has your order' },
  { value: 'on_the_way', label: 'On the Way', description: 'Your order is on its way' },
  { value: 'delivered', label: 'Delivered', description: 'Order has been delivered' },
  { value: 'cancelled', label: 'Cancelled', description: 'Order was cancelled' },
] as const;

export const DOCUMENT_REQUIREMENTS = {
  customer: [
    { type: 'government_id', label: 'Government ID', required: true },
    { type: 'residency_proof', label: 'Proof of Residency (Barangay Certificate or Utility Bill)', required: true },
    { type: 'selfie', label: 'Selfie (Clear face photo)', required: true },
  ],
  business: [
    { type: 'business_permit', label: 'Business Permit / DTI Registration', required: true },
    { type: 'barangay_clearance', label: 'Barangay Clearance', required: true },
    { type: 'store_photo', label: 'Photo of your Store/Eatery', required: true },
    { type: 'government_id', label: 'Owner Government ID', required: true },
  ],
  rider: [
    { type: 'drivers_license', label: "Driver's License", required: true },
    { type: 'motorcycle_photo', label: 'Photo of Motorcycle (with plate visible)', required: true },
    { type: 'selfie', label: 'Selfie (Clear face photo for profile)', required: true },
    { type: 'government_id', label: 'Government ID', required: true },
  ],
} as const;

export const NAV_ITEMS = {
  customer: [
    { label: 'Browse', href: '/dashboard/customer', icon: 'MagnifyingGlassIcon' },
    { label: 'My Orders', href: '/dashboard/customer/orders', icon: 'ShoppingBagIcon' },
    { label: 'Profile', href: '/dashboard/customer/profile', icon: 'UserIcon' },
  ],
  business: [
    { label: 'Dashboard', href: '/dashboard/business', icon: 'HomeIcon' },
    { label: 'Menu', href: '/dashboard/business/menu', icon: 'BookOpenIcon' },
    { label: 'Orders', href: '/dashboard/business/orders', icon: 'ShoppingBagIcon' },
    { label: 'Settings', href: '/dashboard/business/settings', icon: 'CogIcon' },
    { label: 'Profile', href: '/dashboard/business/profile', icon: 'UserIcon' },
  ],
  rider: [
    { label: 'Available', href: '/dashboard/rider', icon: 'TruckIcon' },
    { label: 'Active', href: '/dashboard/rider/active', icon: 'MapPinIcon' },
    { label: 'History', href: '/dashboard/rider/history', icon: 'ClockIcon' },
    { label: 'Earnings', href: '/dashboard/rider/earnings', icon: 'BanknotesIcon' },
    { label: 'Profile', href: '/dashboard/rider/profile', icon: 'UserIcon' },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: 'HomeIcon' },
    { label: 'Users', href: '/dashboard/admin/users', icon: 'UsersIcon' },
    { label: 'Businesses', href: '/dashboard/admin/businesses', icon: 'BuildingStorefrontIcon' },
    { label: 'Riders', href: '/dashboard/admin/riders', icon: 'TruckIcon' },
    { label: 'Orders', href: '/dashboard/admin/orders', icon: 'ShoppingBagIcon' },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: 'CogIcon' },
  ],
} as const;
