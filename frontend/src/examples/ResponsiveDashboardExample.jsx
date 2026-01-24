import { useState, useEffect } from 'react';
import ResponsiveLayout from '../components/ResponsiveLayout';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * Responsive Dashboard Example
 * Shows different layouts for desktop and mobile
 */
export default function Dashboard() {
  return (
    <ResponsiveLayout
      desktop={<DesktopDashboard />}
      mobile={<MobileDashboard />}
    />
  );
}

/**
 * Desktop Dashboard (Unchanged from original)
 */
function DesktopDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    // Fetch stats from API
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Your existing API call
    // setStats(data);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Stats Grid - Desktop: 4 columns */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          color="blue"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon="🛍️"
          color="green"
        />
        <StatCard
          title="Revenue"
          value={`$${stats.totalRevenue}`}
          icon="💰"
          color="purple"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockItems}
          icon="⚠️"
          color="red"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          {/* Your existing table */}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Products</h2>
          {/* Your existing chart */}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Dashboard (New - Mobile Optimized)
 */
function MobileDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Same API call as desktop
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-6" style={{ paddingTop: '70px' }}>
      {/* Mobile Header */}
      <div className="bg-white px-4 py-4 shadow-md mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="px-4">
        {/* Stats Grid - Mobile: 2 columns or single column */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MobileStatCard
            title="Products"
            value={stats.totalProducts}
            icon="📦"
            color="bg-blue-500"
          />
          <MobileStatCard
            title="Orders"
            value={stats.totalOrders}
            icon="🛍️"
            color="bg-green-500"
          />
          <MobileStatCard
            title="Revenue"
            value={`$${stats.totalRevenue}`}
            icon="💰"
            color="bg-purple-500"
          />
          <MobileStatCard
            title="Low Stock"
            value={stats.lowStockItems}
            icon="⚠️"
            color="bg-red-500"
          />
        </div>

        {/* Mobile Sections - Stacked Vertically */}
        <div className="space-y-4">
          <MobileSection title="Recent Orders">
            {/* Mobile-friendly order cards */}
            <div className="space-y-2">
              <OrderCard orderId="#1234" status="Pending" amount="$99.99" />
              <OrderCard orderId="#1235" status="Shipped" amount="$149.99" />
              <OrderCard orderId="#1236" status="Delivered" amount="$79.99" />
            </div>
          </MobileSection>

          <MobileSection title="Top Products">
            {/* Mobile-friendly product list */}
            <div className="space-y-2">
              <ProductCard name="Product A" sales={150} />
              <ProductCard name="Product B" sales={120} />
              <ProductCard name="Product C" sales={90} />
            </div>
          </MobileSection>
        </div>
      </div>
    </div>
  );
}

/**
 * Desktop Stat Card
 */
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <div className={`w-12 h-12 ${colors[color]} rounded-full flex items-center justify-center opacity-20`}></div>
      </div>
      <p className="text-gray-600 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

/**
 * Mobile Stat Card
 */
function MobileStatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-gray-600 text-xs mb-1">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

/**
 * Mobile Section Container
 */
function MobileSection({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-200">
        {title}
      </h2>
      {children}
    </div>
  );
}

/**
 * Example Order Card for Mobile
 */
function OrderCard({ orderId, status, amount }) {
  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Shipped': 'bg-blue-100 text-blue-800',
    'Delivered': 'bg-green-100 text-green-800'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-semibold text-sm">{orderId}</p>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <p className="font-bold text-lg">{amount}</p>
    </div>
  );
}

/**
 * Example Product Card for Mobile
 */
function ProductCard({ name, sales }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <p className="font-semibold text-sm">{name}</p>
      <div className="text-right">
        <p className="text-xs text-gray-500">Sales</p>
        <p className="font-bold">{sales}</p>
      </div>
    </div>
  );
}
