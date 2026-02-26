/**
 * Utilidades para logs de auditoría administrativa
 * Registra todas las acciones críticas del admin
 */

import { supabase } from './supabase'

export interface AdminLogData {
  userId?: string
  userEmail?: string
  action: string
  tableName?: string
  recordId?: string
  oldData?: any
  newData?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Registra una acción administrativa en la tabla de logs
 */
export async function logAdminAction(data: AdminLogData): Promise<void> {
  try {
    await supabase.from('admin_logs').insert({
      user_id: data.userId,
      user_email: data.userEmail,
      action: data.action,
      table_name: data.tableName,
      record_id: data.recordId,
      old_data: data.oldData,
      new_data: data.newData,
      ip_address: data.ipAddress,
      user_agent: data.userAgent
    })
  } catch (error) {
    console.error('Error logging admin action:', error)
    // No lanzar error para no interrumpir la operación principal
  }
}

/**
 * Registra acción desde un API route con Request
 */
export async function logAdminActionFromRequest(
  action: string,
  request: Request,
  tableName?: string,
  recordId?: string,
  oldData?: any,
  newData?: any
): Promise<void> {
  try {
    // Obtener información del usuario actual
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.warn('No session found for logging')
      return
    }

    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logAdminAction({
      userId: session.user.id,
      userEmail: session.user.email,
      action,
      tableName,
      recordId,
      oldData,
      newData,
      ipAddress: ip,
      userAgent
    })
  } catch (error) {
    console.error('Error logging admin action from request:', error)
  }
}

/**
 * Obtiene logs de auditoría con filtros
 */
export async function getAdminLogs(options?: {
  limit?: number
  userId?: string
  action?: string
  tableName?: string
  startDate?: Date
  endDate?: Date
}) {
  try {
    let query = supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options?.action) {
      query = query.eq('action', options.action)
    }

    if (options?.tableName) {
      query = query.eq('table_name', options.tableName)
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString())
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching admin logs:', error)
    return []
  }
}

/**
 * Acciones comunes para registrar
 */
export const AdminActions = {
  // Productos
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  
  // Categorías
  CREATE_CATEGORY: 'CREATE_CATEGORY',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  
  // Configuración
  UPDATE_CONFIG: 'UPDATE_CONFIG',
  UPDATE_LOGO: 'UPDATE_LOGO',
  
  // Ordenes
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
  CANCEL_ORDER: 'CANCEL_ORDER',
  
  // Sesión
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  ADMIN_LOGOUT: 'ADMIN_LOGOUT',
  
  // Filtros
  TOGGLE_FILTER: 'TOGGLE_FILTER',
  
  // Etiquetas
  CREATE_TAG: 'CREATE_TAG',
  UPDATE_TAG: 'UPDATE_TAG',
  DELETE_TAG: 'DELETE_TAG'
} as const
