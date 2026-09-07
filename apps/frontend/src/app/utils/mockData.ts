export const mockCustomers = [
  {
    id: 1,
    name: "Raj Enterprises",
    phone: "+91 98765 43210",
    email: "raj@rajenterprises.com",
    city: "Mumbai",
    totalOrders: 12,
    addresses: [
      {
        id: 1,
        addressLine: "123 Market Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001"
      },
      {
        id: 2,
        addressLine: "456 Industrial Area",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001"
      }
    ]
  },
  {
    id: 2,
    name: "Green Foods Co.",
    phone: "+91 98234 56789",
    email: "contact@greenfoods.com",
    city: "Bangalore",
    totalOrders: 8,
    addresses: [
      {
        id: 3,
        addressLine: "789 Green Valley",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001"
      }
    ]
  },
  {
    id: 3,
    name: "Sharma Trading",
    phone: "+91 97123 45678",
    email: "sharma@trading.com",
    city: "Delhi",
    totalOrders: 15,
    addresses: [
      {
        id: 4,
        addressLine: "321 Connaught Place",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001"
      }
    ]
  },
  {
    id: 4,
    name: "Coastal Distributors",
    phone: "+91 95678 90123",
    email: "info@coastaldist.com",
    city: "Mangalore",
    totalOrders: 6,
    addresses: [
      {
        id: 5,
        addressLine: "567 Beach Road",
        city: "Mangalore",
        state: "Karnataka",
        pincode: "575001"
      }
    ]
  }
];

export const mockProducts = [
  { id: 1, name: "10 inch Round Plate", createdDate: "2024-01-15" },
  { id: 2, name: "12 inch Round Plate", createdDate: "2024-01-16" },
  { id: 3, name: "8 inch Square Plate", createdDate: "2024-01-18" },
  { id: 4, name: "10 inch Square Plate", createdDate: "2024-02-01" },
  { id: 5, name: "6 inch Bowl", createdDate: "2024-02-05" }
];

export const mockOrders = [
  {
    id: "ORD-001",
    customerId: 1,
    customerName: "Raj Enterprises",
    orderDate: "2026-03-01",
    deliveryDate: "2026-03-15",
    addressId: 1,
    status: "In Production",
    notes: "Handle with care",
    products: [
      { productId: 1, productName: "10 inch Round Plate", quantity: 5000 },
      { productId: 3, productName: "8 inch Square Plate", quantity: 3000 }
    ]
  },
  {
    id: "ORD-002",
    customerId: 2,
    customerName: "Green Foods Co.",
    orderDate: "2026-03-03",
    deliveryDate: "2026-03-20",
    addressId: 3,
    status: "Pending",
    notes: "",
    products: [
      { productId: 2, productName: "12 inch Round Plate", quantity: 2000 }
    ]
  },
  {
    id: "ORD-003",
    customerId: 3,
    customerName: "Sharma Trading",
    orderDate: "2026-02-25",
    deliveryDate: "2026-03-10",
    addressId: 4,
    status: "Delivered",
    notes: "",
    products: [
      { productId: 4, productName: "10 inch Square Plate", quantity: 4000 },
      { productId: 5, productName: "6 inch Bowl", quantity: 2500 }
    ]
  },
  {
    id: "ORD-004",
    customerId: 4,
    customerName: "Coastal Distributors",
    orderDate: "2026-03-05",
    deliveryDate: "2026-03-18",
    addressId: 5,
    status: "In Production",
    notes: "Express delivery required",
    products: [
      { productId: 1, productName: "10 inch Round Plate", quantity: 1500 }
    ]
  },
  {
    id: "ORD-005",
    customerId: 1,
    customerName: "Raj Enterprises",
    orderDate: "2026-03-06",
    deliveryDate: "2026-03-22",
    addressId: 2,
    status: "Pending",
    notes: "",
    products: [
      { productId: 3, productName: "8 inch Square Plate", quantity: 2000 }
    ]
  }
];

export const mockInventory = [
  {
    productId: 1,
    productName: "10 inch Round Plate",
    availableStock: 12000,
    bookedStock: 6500,
    freeStock: 5500,
    dailyProduction: 2000
  },
  {
    productId: 2,
    productName: "12 inch Round Plate",
    availableStock: 8000,
    bookedStock: 2000,
    freeStock: 6000,
    dailyProduction: 1500
  },
  {
    productId: 3,
    productName: "8 inch Square Plate",
    availableStock: 15000,
    bookedStock: 5000,
    freeStock: 10000,
    dailyProduction: 2500
  },
  {
    productId: 4,
    productName: "10 inch Square Plate",
    availableStock: 6000,
    bookedStock: 4000,
    freeStock: 2000,
    dailyProduction: 1200
  },
  {
    productId: 5,
    productName: "6 inch Bowl",
    availableStock: 9000,
    bookedStock: 2500,
    freeStock: 6500,
    dailyProduction: 1800
  }
];

export const mockProduction = [
  {
    id: 1,
    productId: 1,
    productName: "10 inch Round Plate",
    quantity: 2000,
    date: "2026-03-08"
  },
  {
    id: 2,
    productId: 3,
    productName: "8 inch Square Plate",
    quantity: 2500,
    date: "2026-03-08"
  },
  {
    id: 3,
    productId: 2,
    productName: "12 inch Round Plate",
    quantity: 1500,
    date: "2026-03-07"
  },
  {
    id: 4,
    productId: 5,
    productName: "6 inch Bowl",
    quantity: 1800,
    date: "2026-03-07"
  },
  {
    id: 5,
    productId: 4,
    productName: "10 inch Square Plate",
    quantity: 1200,
    date: "2026-03-07"
  }
];
