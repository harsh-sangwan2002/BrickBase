import { supabaseAdmin } from '../config/supabase';

export const adminRepository = {
  async logAction(adminId: string, action: string, targetTable: string, targetId: string, details?: unknown) {
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({ admin_id: adminId, action, target_table: targetTable, target_id: targetId, details: details ?? null });
  },

  async listReports() {
    const { data, error } = await supabaseAdmin
      .from('reported_listings')
      .select('*, properties(id, title)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async updateReportStatus(id: number, status: string) {
    const { data, error } = await supabaseAdmin
      .from('reported_listings')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async analyticsSummary() {
    const [{ count: totalUsers }, { count: totalProperties }, { count: totalEnquiries }] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('properties').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('enquiries').select('*', { count: 'exact', head: true }),
    ]);

    const { data: usersByRole } = await supabaseAdmin.from('profiles').select('role');
    const { data: propertiesByStatus } = await supabaseAdmin.from('properties').select('status, property_type');

    const roleCounts: Record<string, number> = {};
    (usersByRole ?? []).forEach((row: { role: string }) => {
      roleCounts[row.role] = (roleCounts[row.role] ?? 0) + 1;
    });

    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    (propertiesByStatus ?? []).forEach((row: { status: string; property_type: string }) => {
      statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
      typeCounts[row.property_type] = (typeCounts[row.property_type] ?? 0) + 1;
    });

    return {
      total_users: totalUsers ?? 0,
      total_properties: totalProperties ?? 0,
      total_enquiries: totalEnquiries ?? 0,
      users_by_role: roleCounts,
      properties_by_status: statusCounts,
      properties_by_type: typeCounts,
    };
  },
};
