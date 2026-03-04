// app/composables/useProfile.ts
export const useProfile = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const getProfile = () => {
    return useAsyncData('user-profile', async () => {
      if (!user.value) return null
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      if (error) throw error
      return data
    })
  }

  const updateProfile = async (updates: { full_name: string; phone: string }) => {
    if (!user.value) return
    const { error } = await client.from('profiles').update(updates).eq('id', user.value.id)
    if (error) throw error
  }

  return { getProfile, updateProfile }
}