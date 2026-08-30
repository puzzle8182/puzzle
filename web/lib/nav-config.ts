export type AppRole = 'empresa_admin' | 'colaborador' | 'psicologo' | 'admin_plataforma'

export type NavItem = {
  label: string
  href: string
  icon: 'home' | 'users' | 'calendar' | 'file' | 'chart' | 'card' | 'search' | 'settings'
}

export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  empresa_admin: [
    { label: 'Visão geral', href: '/dashboard', icon: 'home' },
    { label: 'Colaboradores', href: '/colaboradores', icon: 'users' },
    { label: 'Indicadores', href: '/indicadores', icon: 'chart' },
    { label: 'Faturas', href: '/faturas', icon: 'card' },
  ],
  colaborador: [
    { label: 'Início', href: '/dashboard', icon: 'home' },
    { label: 'Buscar psicólogo', href: '/buscar', icon: 'search' },
    { label: 'Meus agendamentos', href: '/agendamentos', icon: 'calendar' },
  ],
  psicologo: [
    { label: 'Agenda', href: '/dashboard', icon: 'calendar' },
    { label: 'Pacientes', href: '/pacientes', icon: 'users' },
    { label: 'Prontuários', href: '/prontuarios', icon: 'file' },
    { label: 'Financeiro', href: '/financeiro', icon: 'card' },
  ],
  admin_plataforma: [
    { label: 'Visão geral', href: '/dashboard', icon: 'home' },
    { label: 'Empresas', href: '/admin/empresas', icon: 'users' },
    { label: 'Psicólogos', href: '/admin/psicologos', icon: 'users' },
    { label: 'Configurações', href: '/admin/config', icon: 'settings' },
  ],
}

export const ROLE_LABEL: Record<AppRole, string> = {
  empresa_admin: 'Administrador de RH',
  colaborador: 'Colaborador',
  psicologo: 'Psicólogo',
  admin_plataforma: 'Admin da plataforma',
}
