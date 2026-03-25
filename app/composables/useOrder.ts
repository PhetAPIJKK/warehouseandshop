// นิยาม Type สำหรับสถานะออเดอร์
export type OrderStatus = 
  | 'pending_payment' 
  | 'paid_wait_verify' 
  | 'pending_shipment' 
  | 'shipped' 
  | 'completed' 
  | 'cancelled';

// นิยาม Interface พื้นฐาน (ปรับตาม Schema ของคุณ)
interface Member {
  full_name: string;
}

interface Payment {
  id: string;
  order_id: string;
  slip_image_url: string;
  payment_status: string;
  payment_amount: number;
  slip_transfer_datetime: string;
}

interface Address {
  id: string;
  address_detail: string;
  phone: string;
  label?: string;
}

export interface Order {
  id: string;
  order_no: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  tracking_no?: string;
  carrier_name?: string;
  members?: Member;
  address?: Address;
  payments?: Payment[];
}

export const useOrder = () => {
  const client = useSupabaseClient();

  /**
   * ------------------------------------------------------------
   * [SECTION 1] สำหรับลูกค้า (User/Customer)
   * ------------------------------------------------------------
   */

  // 1.1 ดึงประวัติคำสั่งซื้อของตนเอง + ที่อยู่จัดส่ง
  const getUserOrders = async () => {
    return await useAsyncData<Order[]>('user-orders-list', async () => {
      const { data: authData } = await client.auth.getUser();
      const currentUserId = authData.user?.id;

      if (!currentUserId) return [];

      const { data, error } = await client
        .from('orders')
        .select(`
          *,
          address:addresses(*)
        `)
        .eq('created_by_user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    });
  };

  /**
   * ------------------------------------------------------------
   * [SECTION 2] สำหรับแอดมิน (Admin)
   * ------------------------------------------------------------
   */

  // 2.1 ดึงรายการออเดอร์ทั้งหมด
  const getOrdersData = async () => {
    return await useAsyncData<Order[]>('admin-all-orders-list', async () => {
      const { data, error } = await client
        .from('orders')
        .select(`
          *,
          members(full_name),
          address:addresses(address_detail, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    });
  };

  // 2.2 ดึงรายการ "รอตรวจสอบสลิป"
  const getPendingPayments = async () => {
    return await useAsyncData<Order[]>('admin-pending-payments-list', async () => {
      const { data, error } = await client
        .from('orders')
        .select(`
          *,
          members(full_name),
          payments(*)
        `)
        .eq('status', 'paid_wait_verify')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Order[];
    });
  };

  // 2.3 ดึงรายการ "รอจัดส่ง"
  const getPendingShipments = async () => {
    return await useAsyncData<Order[]>('admin-shipping-list', async () => {
      const { data, error } = await client
        .from('orders')
        .select(`
          *,
          members(full_name),
          address:addresses(*)
        `)
        .eq('status', 'pending_shipment')
        .order('updated_at', { ascending: true });

      if (error) throw error;
      return data as Order[];
    });
  };

  /**
   * ------------------------------------------------------------
   * [SECTION 3] Actions (จัดการสถานะ)
   * ------------------------------------------------------------
   */

  // 3.1 อัปเดตสถานะทั่วไป
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { data, error } = await client
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select();

    if (error) throw error;
    return data;
  };

  // 3.2 ยืนยันการส่งสินค้า
  const confirmOrderShipped = async (orderId: string, trackingNo: string, carrierName: string = 'Flash Express') => {
    const { data, error } = await client
      .from('orders')
      .update({
        status: 'shipped',
        tracking_no: trackingNo,
        carrier_name: carrierName,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select();

    if (error) throw error;
    return data;
  };

  return {
    getUserOrders,
    getOrdersData,
    getPendingPayments,
    getPendingShipments,
    updateOrderStatus,
    confirmOrderShipped
  };
};