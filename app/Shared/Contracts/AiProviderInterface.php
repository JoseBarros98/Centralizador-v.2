<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

use App\Shared\DTOs\AiResponseDTO;

interface AiProviderInterface
{
    public function chat(string $message, array $history = [], ?string $contextType = null, ?string $contextId = null): AiResponseDTO;
    public function analyze(string $content, string $prompt): AiResponseDTO;
    public function generateDocument(string $template, array $data): AiResponseDTO;
}
