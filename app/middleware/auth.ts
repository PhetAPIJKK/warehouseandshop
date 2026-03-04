// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const { getRole } = useUserRole()
  const { data: role } = await getRole()

  // 1. ถ้ายังไม่ได้ล็อกอิน และพยายามเข้าหน้าอื่นที่ไม่ใช่หน้าสาธารณะ
  const publicPages = ['/', '/login', '/products']
  if (!user.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  // 2. ถ้าล็อกอินแล้วเป็น Admin และกำลังจะไปหน้าแรก ให้ส่งไปหลังบ้าน
  if (user.value && role.value === 'admin' && to.path === '/') {
    return navigateTo('/dashboard')
  }

  // 3. ป้องกันคนไม่ใช่ Admin แอบเข้าหน้า Dashboard
  if (to.path.startsWith('/dashboard') && role.value !== 'admin') {
    return navigateTo('/')
  }
})