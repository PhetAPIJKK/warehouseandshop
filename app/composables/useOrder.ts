export const useOrder = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  /**
   * 1. สำหรับลูกค้า (User): ดึงประวัติคำสั่งซื้อของตนเอง
   * แก้ปัญหา UUID: "undefined" โดยการใช้ guard และ watch
   */
 const getUserOrders = async () => {
    return await useAsyncData('user-orders-list', async () => {
      
      // ⭐️ เปลี่ยนมาใช้ client.auth.getUser() ตรงๆ เพื่อความชัวร์ 100% ว่ารอจนกว่าจะได้ ID
      const { data: authData } = await client.auth.getUser()
      const currentUserId = authData.user?.id

      if (!currentUserId) {
        console.warn("ไม่พบ User Session ยืนยันตัวตน")
        return [] // ถ้ายังไม่ได้ล็อกอิน ให้คืนค่าว่างไปก่อน
      }

      console.log("✅ ID ที่ใช้ดึงออเดอร์สำเร็จคือ:", currentUserId)

      // นำ ID ที่ได้ชัวร์ๆ ไปดึงข้อมูล
      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('created_by_user_id', currentUserId)
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error("Error fetching user orders:", error.message)
        throw error
      }
      return data
    })
  }

  /**
   * 2. สำหรับแอดมิน (Admin): ดูรายการออเดอร์ทั้งหมด (เว็บ/หน้าร้าน)
   */
  const getOrdersData = async () => {
    return await useAsyncData('admin-all-orders-list', async () => {
      const { data, error } = await client
        .from('orders')
        .select('*, members(full_name)')
        .order('created_at', { ascending: false })
        
      if (error) {
        console.error("Error fetching admin orders:", error.message)
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
        .select('*, members(full_name), payments(*)')
        .eq('status', 'paid_wait_verify')
        .order('created_at', { ascending: true }) // ลูกค้าที่แจ้งก่อน ต้องได้รับการตรวจก่อน
        
      if (error) {
        console.error("Error fetching pending payments:", error.message)
        throw error
      }
      return data
    })
  }

  return {
    getUserOrders,
    getOrdersData,
    getPendingPayments
  }
}