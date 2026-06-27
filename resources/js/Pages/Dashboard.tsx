import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { BookOpen, CreditCard, Layout, Megaphone } from 'lucide-react';

const modules = [
    { label: 'Módulo Académico', icon: BookOpen, href: '/academic', color: 'text-blue-600 bg-blue-50' },
    { label: 'Cobranzas', icon: CreditCard, href: '/billing', color: 'text-green-600 bg-green-50' },
    { label: 'Marketing', icon: Megaphone, href: '/marketing', color: 'text-orange-600 bg-orange-50' },
    { label: 'Diseño', icon: Layout, href: '/design', color: 'text-purple-600 bg-purple-50' },
];

export default function Dashboard() {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {modules.map(({ label, icon: Icon, href, color }) => (
                    <a
                        key={href}
                        href={href}
                        className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className={`rounded-lg p-3 ${color}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <span className="font-medium text-gray-900">{label}</span>
                    </a>
                ))}
            </div>
        </AppLayout>
    );
}
