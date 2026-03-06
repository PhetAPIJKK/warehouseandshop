export const useUserRole = () => {
  const client = useSupabaseClient()
  const role = ref(null)
  const isRoleLoading = ref(true)

  const fetchRole = async () => {
    isRoleLoading.value = true
    const { data: { user } } = await client.auth.getUser()
    
    if (!user) {
      role.value = null
      isRoleLoading.value = false
      return
    }

    const { data, error } = await client
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    role.value = error ? null : data?.role
    isRoleLoading.value = false
  }

  // ⭐️ เคล็ดลับอยู่ที่ตรงนี้: ดักฟังเหตุการณ์การล็อกอิน/เอาต์โดยตรงจาก Supabase Client
  // มันจะทำงานทันทีที่สถานะ Auth เปลี่ยน ไม่ต้องรอ watch() จาก Nuxt
  client.auth.onAuthStateChange((event, session) => {
    fetchRole()
  })

  // โหลดครั้งแรก
  fetchRole()

  return { role, isRoleLoading }
}