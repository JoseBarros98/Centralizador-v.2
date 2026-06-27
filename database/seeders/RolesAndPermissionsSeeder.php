<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $roles = [
            'super-admin',
            'academic-admin',
            'billing-admin',
            'marketing-admin',
            'design-admin',
            'academic-staff',
            'billing-staff',
            'marketing-staff',
            'design-staff',
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        Role::findByName('super-admin')->givePermissionTo(Permission::all());
    }
}
