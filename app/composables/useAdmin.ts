// composables/useAdmin.ts

export const useAdmin = () => {
  const client = useSupabaseClient();

  const getDashboardSummary = async () => {
    return await useAsyncData('admin-summary', async () => {
      // ดึงข้อมูลหลายอย่างพร้อมกันแบบ Parallel
      const [revenue, lowStock, totalOrders, pendingShip] = await Promise.all([
        client.rpc('get_total_revenue'),
        client.rpc('get_low_stock_count', { threshold: 5 }),
        client.from('orders').select('*', { count: 'exact', head: true }),
        client.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_shipment')
      ]);

      return {
        totalRevenue: revenue.data || 0,
        lowStockCount: lowStock.data || 0,
        totalOrders: totalOrders.count || 0,
        pendingShipment: pendingShip.count || 0
      };
    });
  };

  // ดึงรายการสินค้าที่สต็อกใกล้หมดมาโชว์เป็นตาราง
  const getLowStockList = async () => {
    return await client
      .from('products')
      .select('product_name, stock_qty')
      .lte('stock_qty', 5)
      .order('stock_qty', { ascending: true });
  };

  return { getDashboardSummary, getLowStockList };
};