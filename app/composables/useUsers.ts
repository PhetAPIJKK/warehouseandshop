export const useUsers = () => {
  const client = useSupabaseClient()

  // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้งานทั้งหมด
  const getAllUsers = () => {
    return useAsyncData('all-users-list', async () => {
      const { data, error } = await client
        .from('users') // ชื่อตารางในฐานข้อมูล public ของคุณ
        .select('*')   // ดึงข้อมูลทุกคอลัมน์ (เช่น id, role, และอื่นๆ)
        .order('id', { ascending: true }) // เรียงลำดับตาม ID (เปลี่ยนเป็นคอลัมน์อื่นได้)

      if (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล Users:", error.message)
        throw error
      }

      // ถ้าไม่มีข้อมูล ให้ส่งกลับเป็น Array ว่าง เพื่อไม่ให้หน้าเว็บพัง
      return data || []
    })
  }

  return { getAllUsers }
}