<?php

declare(strict_types=1);

namespace App\Shared\Exceptions;

use RuntimeException;

final class ExternalServiceException extends RuntimeException
{
    public function __construct(
        string $service,
        string $message,
        ?\Throwable $previous = null,
    ) {
        parent::__construct("[$service] $message", 503, $previous);
    }
}
