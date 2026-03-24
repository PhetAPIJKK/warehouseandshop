export const useOrder = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * 1. สำหรับลูกค้า (User): ดึงประวัติคำสั่งซื้อของตนเอง + ที่อยู่จัดส่ง
   * แก้ปัญหา UUID: "undefined" โดยการรอผลจาก client.auth.getUser()
   */
  const getUserOrders = async () => {
    return await useAsyncData('user-orders-list', async () => {
      
      // ⭐️ รอจนกว่าจะได้ ID จริงๆ มา (ป้องกัน Error SSR/Hydration)
      const { data: authData } = await client.auth.getUser()
      const currentUserId = authData.user?.id

      if (!currentUserId) {
        console.warn("⚠️ ไม่พบ User Session ยืนยันตัวตน")
        return []
      }

      console.log("✅ ID ที่ใช้ดึงออเดอร์สำเร็จคือ:", currentUserId)

      // ดึงออเดอร์ พร้อม Join ตาราง addresses เพื่อเอามาโชว์ที่หน้าประวัติ
      const { data, error } = await client
        .from('orders')
        .select(`
          *,
          address:addresses(*)
        `) // 📍 ดึงข้อมูลที่อยู่จัดส่งมาด้วย
        .eq('created_by_user_id', currentUserId)
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error("❌ Error fetching user orders:", error.message)
        throw error
      }
      return data
    })
  }

  /**
   * 2. สำหรับแอดมิน (Admin): ดูรายการออเดอร์ทั้งหมด (เว็บ/หน้าร้าน)
   * แสดงชื่อลูกค้าจากตาราง members
   */
  const getOrdersData = async () => {
    return await useAsyncData('admin-all-orders-list', async () => {
      const { data, error } = await client
        .from('orders')
        .select(`
          *,
          members(full_name),
          address:addresses(address_detail, phone)
        `) // 📍 Admin เห็นทั้งชื่อลูกค้าและที่อยู่จัดส่ง
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error("❌ Error fetching admin orders:", error.message)
        throw error
      }
      return data
    })
  }

  /**
   * 3. สำหรับแอดมิน (Admin): ดึงเฉพาะออเดอร์ที่รอตรวจสลิป
   * FIFO: ดึงออเดอร์เก่าสุดขึ้นก่อน เพื่อให้แอดมินเคลียร์ตามคิว
   */
  const getPendingPayments = async () => {
    return await useAsyncData('admin-pending-payments-list', async () => {
      const { data, error } = await client
        .from('orders')
        .select(`
          *,
          members(full_name),
          payments(*)
        `) // 📍 ดึงข้อมูลการชำระเงินและสลิปมาตรวจสอบ
        .eq('status', 'paid_wait_verify')
        .order('created_at', { ascending: true }) // FIFO: แจ้งก่อน ตรวจก่อน
        
      if (error) {
        console.error("❌ Error fetching pending payments:", error.message)
        throw error
      }
      return data
    })
  }

  /**
   * 4. ฟังก์ชันเสริม: อัปเดตสถานะออเดอร์ (แถมให้สำหรับแอดมินกด Approve/Reject)
   */
  const updateOrderStatus = async (orderId, newStatus) => {
    const { data, error } = await client
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()

    if (error) throw error
    return data
  }

  return {
    getUserOrders,
    getOrdersData,
    getPendingPayments,
    updateOrderStatus
  }
}