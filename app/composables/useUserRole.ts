// app/composables/useUserRole.ts
export const useUserRole = () => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()

  const getRole = () => {
    return useAsyncData('user-role', async () => {
      if (!user.value) return null
      // ดึงจากตาราง users ตามฐานข้อมูลของคุณ
      const { data } = await client
        .from('users')
        .select('role')
        .eq('email', user.value.email)
        .single()
      return data?.role // จะคืนค่า 'admin' หรือ 'customer'
    }, { watch: [user] })
  }

  return { getRole }
}