// app/composables/useAuth.ts
export const useAuth = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const logout = async () => {
    await client.auth.signOut()
    navigateTo('/login')
  }

  return { user, logout }
}