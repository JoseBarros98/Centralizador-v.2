<?php

declare(strict_types=1);

namespace App\Shared\Exceptions;

use RuntimeException;

final class BusinessException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly string $errorCode = 'BUSINESS_ERROR',
        int $statusCode = 422,
    ) {
        parent::__construct($message, $statusCode);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getStatusCode(): int
    {
        return $this->getCode();
    }
}
