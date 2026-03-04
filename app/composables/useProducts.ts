// app/composables/useProducts.ts
export const useProducts = () => {
  const client = useSupabaseClient()

  const getFeaturedProducts = (limit = 4) => {
    return useAsyncData(`featured-${limit}`, async () => {
      const { data, error } = await client
        .from('products')
        .select('*, product_categories(name)')
        .limit(limit)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    })
  }

  const getAllProducts = () => {
    return useAsyncData('all-products', async () => {
      const { data, error } = await client
        .from('products')
        .select('*, product_categories(name)')
      if (error) throw error
      return data
    }) // <-- แก้จาก asy เป็น async () => และปิดวงเล็บให้ถูก
  }

  return { getFeaturedProducts, getAllProducts }
}