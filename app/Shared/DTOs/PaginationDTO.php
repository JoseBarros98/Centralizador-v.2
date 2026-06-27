<?php

declare(strict_types=1);

namespace App\Shared\DTOs;

final readonly class PaginationDTO
{
    public function __construct(
        public int $page = 1,
        public int $perPage = 15,
        public ?string $search = null,
        public ?string $sortBy = null,
        public string $sortDirection = 'asc',
    ) {}

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self(
            page: (int) $request->get('page', 1),
            perPage: (int) $request->get('per_page', 15),
            search: $request->get('search'),
            sortBy: $request->get('sort_by'),
            sortDirection: $request->get('sort_direction', 'asc'),
        );
    }
}
