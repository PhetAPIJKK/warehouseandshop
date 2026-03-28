// app/composables/useInventory.ts

export const useInventory = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser() // ดึง User แบบ Reactive สำหรับเช็คเบื้องต้น

  // Helper: ดึง User ID แบบชัวร์ๆ สำหรับงานเขียน (Write Operations)
  const getUserId = async () => {
    const { data } = await client.auth.getUser()
    return data.user?.id || null
  }

  // ==========================================
  // 1. ระบบจัดการรูปภาพ (Storage)
  // ==========================================
  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name}`
    const { data, error } = await client.storage
      .from('image_product')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) return { error }

    const { data: { publicUrl } } = client.storage
      .from('image_product')
      .getPublicUrl(fileName)

    return { publicUrl }
  }

  // ==========================================
  // 2. ระบบจัดการหมวดหมู่ (Product Categories)
  // ==========================================
  
  // ดึงหมวดหมู่ทั้งหมด (ใช้ useAsyncData เพื่อให้หน้าบ้านกด refresh() ได้)
  const getCategories = () => {
    return useAsyncData('product-categories', async () => {
      const { data, error } = await client
        .from('product_categories') 
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data || []
    })
  }

  // เพิ่มหมวดหมู่ใหม่
 const addCategory = async (payload) => {
  // มั่นใจว่าชื่อตารางคือ product_categories (มี s) ตาม Schema
  const { data, error } = await client
    .from('product_categories') 
    .insert([
      { 
        name: payload.name, 
        description: payload.description 
      }
    ])
    .select() // ต้องมี select() เพื่อให้คืนค่ากลับมาเช็คสำเร็จ

  return { data, error }
}

  // ลบหมวดหมู่
  const deleteCategory = async (id: string) => {
    return await client
      .from('product_categories')
      .delete()
      .eq('id', id)
  }

  // ==========================================
  // 3. ระบบจัดการสินค้า (Products CRUD)
  // ==========================================

  // ดึงข้อมูลสินค้าทั้งหมด (Join product_categories เพื่อเอาชื่อมาโชว์)
  const getInventoryData = () => {
    return useAsyncData('products-list', async () => {
      const { data, error } = await client
        .from('products')
        .select('*, product_categories(name)') // Join อัตโนมัติ
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase Error:', error.message)
        return []
      }
      return data || []
    })
  }

  const getProductById = async (id: string) => {
    return await client
      .from('products')
      .select('*, product_categories(name)')
      .eq('id', id)
      .single()
  }

  const addProduct = async (productData: any) => {
    const userId = await getUserId()
    if (!userId) return { error: { message: 'กรุณา Login ใหม่ (ID: undefined)' } }

    const payloadToInsert = { ...productData, created_by: userId }

    const { data: newProduct, error: productError } = await client
      .from('products')
      .insert(payloadToInsert)
      .select()
      .single()

    if (productError) return { error: productError }

    // บันทึกยอดยกมา (Initial Stock)
    if (productData.stock_qty > 0) {
      await client.from('stock_movements').insert({
        item_type: 'product',
        movement_type: 'initial_stock',
        ref_table: 'products',
        ref_id: newProduct.id,
        product_id: newProduct.id,
        qty_in: productData.stock_qty,
        balance_after: productData.stock_qty,
        created_by: userId
      })
    }
    return { error: null, data: newProduct }
  }

  const updateProduct = async (id: string, productData: any) => {
    const userId = await getUserId()
    const payloadWithAudit = {
      ...productData,
      updated_at: new Date().toISOString(),
      updated_by: userId
    }
    return await client.from('products').update(payloadWithAudit).eq('id', id)
  }

  const deleteProduct = async (id: string) => {
    return await client.from('products').delete().eq('id', id)
  }

  // ==========================================
  // 4. ระบบคลังสินค้า (Stock Movements)
  // ==========================================

  const adjustProductStock = async (productId: string, qty: number, type: string) => {
    const userId = await getUserId()
    const { data: product } = await client.from('products').select('stock_qty').eq('id', productId).single()
    
    const currentStock = product?.stock_qty || 0
    const isOut = ['issue', 'adjust'].includes(type)
    const qtyChange = isOut ? -Math.abs(qty) : Math.abs(qty)
    const balanceAfter = currentStock + qtyChange

    if (balanceAfter < 0) return { error: { message: 'สต็อกคงเหลือติดลบไม่ได้!' } }

    await client.from('products').update({ stock_qty: balanceAfter, updated_by: userId }).eq('id', productId)

    const { error: logError } = await client.from('stock_movements').insert({
      item_type: 'product',
      movement_type: type,
      ref_table: 'manual',
      product_id: productId,
      qty_in: !isOut ? Math.abs(qty) : 0,
      qty_out: isOut ? Math.abs(qty) : 0,
      balance_after: balanceAfter,
      created_by: userId
    })
    return { error: logError }
  }

  const produceProduct = async (productId: string, qty: number, note = '') => {
    const userId = await getUserId()
    const { data: prodLog, error: prodError } = await client.from('production_logs').insert({
      product_id: productId, qty_produced: qty, produced_by: userId, note
    }).select().single()

    if (prodError) return { error: prodError }

    const { data: product } = await client.from('products').select('stock_qty').eq('id', productId).single()
    const newStock = (product?.stock_qty || 0) + Math.abs(qty)

    await client.from('products').update({ stock_qty: newStock, updated_by: userId }).eq('id', productId)

    const { error: moveError } = await client.from('stock_movements').insert({
      item_type: 'product',
      movement_type: 'produce_in',
      ref_table: 'production_logs',
      ref_id: prodLog.id,
      product_id: productId,
      qty_in: Math.abs(qty),
      balance_after: newStock,
      created_by: userId
    })
    return { error: moveError, data: prodLog }
  }

  const recordSale = async (productId: string, qty: number) => {
    const userId = await getUserId()
    const { data: product } = await client.from('products').select('stock_qty').eq('id', productId).single()
    const newStock = (product?.stock_qty || 0) - Math.abs(qty)

    if (newStock < 0) return { error: { message: 'สต็อกไม่พอขาย!' } }

    await client.from('products').update({ stock_qty: newStock }).eq('id', productId)
    return await client.from('stock_movements').insert({
      item_type: 'product',
      movement_type: 'sale_out',
      ref_table: 'manual',
      product_id: productId,
      qty_out: Math.abs(qty),
      balance_after: newStock,
      created_by: userId
    })
  }

  const getProductMovements = async (productId: string) => {
    return await client.from('stock_movements').select('*').eq('product_id', productId).order('created_at', { ascending: false })
  }

  return {
    uploadImage,
    getCategories,
    addCategory,
    deleteCategory,
    getInventoryData,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustProductStock,
    produceProduct,
    recordSale,
    getProductMovements
  }
}