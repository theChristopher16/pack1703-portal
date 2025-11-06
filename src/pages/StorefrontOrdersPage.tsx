import React, { useState } from 'react';
import { OrderHistory, Order } from '../components/Storefront';

// Sample orders - in production, this would come from Firestore
const sampleOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'PK1703-00123456',
    date: new Date('2025-01-15'),
    status: 'delivered',
    items: [
      {
        id: '1',
        name: 'Pack 1703 Spirit T-Shirt',
        image: '/products/tshirt-blue.jpg',
        quantity: 2,
        price: 24.99
      },
      {
        id: '3',
        name: 'Water Bottle - Stainless Steel',
        image: '/products/bottle-blue.jpg',
        quantity: 1,
        price: 34.99
      }
    ],
    subtotal: 84.97,
    tax: 7.43,
    shipping: 0,
    total: 92.40,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    trackingNumber: '1Z999AA10123456784',
    estimatedDelivery: new Date('2025-01-18')
  },
  {
    id: '2',
    orderNumber: 'PK1703-00123457',
    date: new Date('2025-01-28'),
    status: 'shipped',
    items: [
      {
        id: '6',
        name: 'Pack 1703 Hoodie',
        image: '/products/hoodie-gray.jpg',
        quantity: 1,
        price: 44.99
      },
      {
        id: '4',
        name: 'Pack 1703 Baseball Cap',
        image: '/products/cap.jpg',
        quantity: 2,
        price: 19.99
      }
    ],
    subtotal: 84.97,
    tax: 7.43,
    shipping: 0,
    total: 92.40,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    trackingNumber: '1Z999AA10123456785',
    estimatedDelivery: new Date('2025-02-02')
  },
  {
    id: '3',
    orderNumber: 'PK1703-00123458',
    date: new Date('2025-02-01'),
    status: 'processing',
    items: [
      {
        id: '8',
        name: 'Scout Handbook',
        image: '/products/handbook.jpg',
        quantity: 1,
        price: 14.99
      },
      {
        id: '2',
        name: 'Cub Scout Neckerchief',
        image: '/products/neckerchief.jpg',
        quantity: 1,
        price: 12.99
      },
      {
        id: '12',
        name: 'Compass - Orienteering',
        image: '/products/compass.jpg',
        quantity: 1,
        price: 18.99
      }
    ],
    subtotal: 46.97,
    tax: 4.11,
    shipping: 5.99,
    total: 57.07,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    estimatedDelivery: new Date('2025-02-08')
  },
  {
    id: '4',
    orderNumber: 'PK1703-00123459',
    date: new Date('2024-12-10'),
    status: 'delivered',
    items: [
      {
        id: '5',
        name: 'Camping Mess Kit',
        image: '/products/mess-kit.jpg',
        quantity: 1,
        price: 29.99
      },
      {
        id: '9',
        name: 'Flashlight - LED Rechargeable',
        image: '/products/flashlight.jpg',
        quantity: 2,
        price: 27.99
      },
      {
        id: '7',
        name: 'First Aid Kit',
        image: '/products/first-aid.jpg',
        quantity: 1,
        price: 39.99
      }
    ],
    subtotal: 125.96,
    tax: 11.02,
    shipping: 0,
    total: 136.98,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    trackingNumber: '1Z999AA10123456783',
    estimatedDelivery: new Date('2024-12-15')
  },
  {
    id: '5',
    orderNumber: 'PK1703-00123460',
    date: new Date('2025-01-05'),
    status: 'cancelled',
    items: [
      {
        id: '10',
        name: 'Pack 1703 Backpack',
        image: '/products/backpack.jpg',
        quantity: 1,
        price: 59.99
      }
    ],
    subtotal: 59.99,
    tax: 5.25,
    shipping: 0,
    total: 65.24,
    shippingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    }
  }
];

export const StorefrontOrdersPage: React.FC = () => {
  const [orders] = useState<Order[]>(sampleOrders);

  const handleViewOrder = (order: Order) => {
    console.log('View order:', order.orderNumber);
    // In production: navigate to order details page
  };

  const handleDownloadInvoice = (orderId: string) => {
    console.log('Download invoice for order:', orderId);
    // In production: generate and download PDF invoice
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Order History Component */}
        <OrderHistory
          orders={orders}
          onViewOrder={handleViewOrder}
          onDownloadInvoice={handleDownloadInvoice}
        />
      </div>
    </div>
  );
};

