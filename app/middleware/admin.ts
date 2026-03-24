// middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const client = useSupabaseClient()
  
  // 1. ตรวจสอบว่าล็อกอินอยู่ไหม
  const { data: { user } } = await client.auth.getUser()
  if (!user) {
    return navigateTo('/login') // ถ้ายังไม่ล็อกอิน ให้ดีดไปหน้า Login
  }

  // 2. ตรวจสอบ Role จากฐานข้อมูล
  const { data: profile, error } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // 3. ถ้าไม่ใช่ admin ให้ดีดกลับไปหน้าแรก
  // if (error || profile?.role !== 'admin') {
  //   return navigateTo('/') 
  // }
})