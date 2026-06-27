import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ChevronDown,
    CreditCard,
    Layout,
    LogOut,
    Megaphone,
    Menu,
    User,
    X,
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import type { PageProps } from '@/shared/types';

interface NavModule {
    label: string;
    slug: string;
    icon: ReactNode;
    href: string;
    requiredRole?: string;
}

const modules: NavModule[] = [
    { label: 'Académico', slug: 'academic', icon: <BookOpen className="h-4 w-4" />, href: '/academic' },
    { label: 'Cobranzas', slug: 'billing', icon: <CreditCard className="h-4 w-4" />, href: '/billing' },
    { label: 'Marketing', slug: 'marketing', icon: <Megaphone className="h-4 w-4" />, href: '/marketing' },
    { label: 'Diseño', slug: 'design', icon: <Layout className="h-4 w-4" />, href: '/design' },
];

export default function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
    const { auth } = usePage<PageProps>().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const currentPath = window.location.pathname;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top navbar */}
            <nav className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo + module nav */}
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <span className="text-lg font-bold text-indigo-600">ESAM</span>
                            </Link>

                            {/* Desktop module links */}
                            <div className="hidden items-center gap-1 md:flex">
                                {modules.map((mod) => {
                                    const active = currentPath.startsWith(mod.href);
                                    return (
                                        <Link
                                            key={mod.slug}
                                            href={mod.href}
                                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            {mod.icon}
                                            {mod.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right side: user menu */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <span className="hidden sm:block">{auth.user.name}</span>
                                    <ChevronDown className="h-3 w-3 text-gray-400" />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-100 bg-white py-1 shadow-lg">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <User className="h-4 w-4" />
                                            Perfil
                                        </Link>
                                        <hr className="my-1 border-gray-100" />
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Cerrar sesión
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
                                onClick={() => setMobileOpen(!mobileOpen)}
                            >
                                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile nav */}
                {mobileOpen && (
                    <div className="border-t border-gray-100 md:hidden">
                        <div className="space-y-1 px-4 py-2">
                            {modules.map((mod) => {
                                const active = currentPath.startsWith(mod.href);
                                return (
                                    <Link
                                        key={mod.slug}
                                        href={mod.href}
                                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                                            active
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {mod.icon}
                                        {mod.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </nav>

            {/* Page title */}
            {title && (
                <header className="border-b border-gray-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                    </div>
                </header>
            )}

            {/* Main content */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
    );
}
