export const useAddress = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  // ฟังก์ชันดึงข้อมูล (เหมือนเดิม)
  const fetchAddresses = async () => {
    // ใช้ client.auth.getUser() เพื่อความชัวร์ที่สุด
    const { data: authData } = await client.auth.getUser()
    const currentUserId = authData.user?.id

    if (!currentUserId) return []
    
    const { data, error } = await client
      .from('addresses')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error('Fetch Address Error:', error)
      return []
    }
    return data || []
  }

  // ⭐️ แก้ไขฟังก์ชันเพิ่มที่อยู่ใหม่ให้ดึง ID แบบชัวร์ 100%
  const addAddress = async (addressData: { label: string, address_detail: string, phone: string }) => {
    
    // 1. ดึง ID จาก Client Auth โดยตรง (ทะลวงไปหลังบ้านเลย ไม่พึ่ง State ของหน้าเว็บแล้ว)
    const { data: authData } = await client.auth.getUser()
    const currentUserId = authData.user?.id

    if (!currentUserId) {
      return { error: 'ไม่พบข้อมูลผู้ใช้ หรือ เซสชันหมดอายุ กรุณาล็อกอินใหม่อีกครั้ง' }
    }

    // 2. ส่งข้อมูลไปบันทึก
    const { data, error } = await client
      .from('addresses')
      .insert([
        { 
          user_id: currentUserId, // 👈 ใช้ ID ที่ชัวร์ที่สุดแล้ว
          label: addressData.label,
          address_detail: addressData.address_detail,
          phone: addressData.phone
        }
      ])

    if (error) {
      console.error('Insert Address Error:', error)
      if (error.message.includes('ADDRESS_LIMIT_REACHED')) {
        return { error: 'คุณมีที่อยู่ครบ 5 รายการแล้ว ไม่สามารถเพิ่มได้อีก' }
      }
      return { error: error.message }
    }
    
    return { success: true }
  }

  // ลบที่อยู่ (เหมือนเดิม)
  const deleteAddress = async (id: string) => {
    const { error } = await client.from('addresses').delete().eq('id', id)
    if (error) return { error: error.message }
    return { success: true }
  }

  return { fetchAddresses, addAddress, deleteAddress }
}