// middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const client = useSupabaseClient()

  // 1. บังคับดึงข้อมูล User จาก Token โดยตรง (แก้ปัญหา undefined ชั่วขณะ)
  const { data: { user }, error: authError } = await client.auth.getUser()

  // ถ้าเกิด Error หรือยังไม่ได้ล็อกอิน ให้ไปหน้า Login
  if (authError || !user) {
    return navigateTo('/login')
  }

  // 2. เช็คสิทธิ์การเข้า Dashboard
  if (to.path.startsWith('/dashboard')) {
    const { data, error } = await client
      .from('users') 
      .select('role')
      .eq('id', user.id) // ใช้ user.id จาก getUser() จะได้ค่า ID ที่ชัวร์ 100%
      .single()

    // ถ้า Query พลาด, ไม่มีข้อมูล, หรือบทบาทไม่ใช่ 'admin' ให้ตีกลับไปหน้าแรก
    if (error || !data || data.role !== 'admin') {
      return navigateTo('/')
    }
  }
})