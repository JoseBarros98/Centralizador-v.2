export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface PageProps {
  auth: {
    user: User;
  };
  flash?: {
    success?: string;
    error?: string;
  };
  [key: string]: unknown;
}

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export type ModuleSlug = 'academic' | 'billing' | 'marketing' | 'design';
