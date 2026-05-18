// Database types
export type Client = {
  id: string;
  company_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  observations: string | null;
  created_at: string;
};

export type Company = {
  id: string;
  name: string;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = 'admin' | 'chefe' | 'funcionario' | 'recepcao' | 'financeiro' | 'professional' | 'receptionist';

export type ProfilePermissions = {
  [key: string]: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
};

export type Profile = {
  id: string;
  company_id: string | null;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  approved: boolean;
  created_at: string;
  companies: Company | null;
  permissions?: ProfilePermissions;
  authorized_by_name?: string | null;
  last_access?: string | null;
  cargo?: string | null;
  status?: 'active' | 'inactive';
};

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show' 
  | 'rescheduled';

export type Procedure = {
  id: string;
  company_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description:string | null;
  color?: string | null;
  maintenance_required: boolean;
  maintenance_days_limit: number | null;
  maintenance_period_unit?: string | null;
  maintenance_duration_minutes?: number | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  company_id: string;
  client_id: string;
  professional_id: string;
  procedure_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  is_maintenance: boolean;
  parent_appointment_id: string | null;
  notes: string | null;
  created_at: string;
};
