export const useInventory = () => {
  const client = useSupabaseClient()

  const getInventoryData = () => {
    return useAsyncData('inventory-list', async () => {
      const { data, error } = await client
        .from('products')
        .select('*, created_by_user:users!created_by(full_name)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    })
  }

  return { getInventoryData }
}