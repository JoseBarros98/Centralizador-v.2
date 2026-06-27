<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

interface RepositoryInterface
{
    public function findById(string $id): ?Model;
    public function save(Model $model): Model;
    public function delete(string $id): bool;
    public function all(): Collection;
}
