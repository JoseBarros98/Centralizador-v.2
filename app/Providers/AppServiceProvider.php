<?php

declare(strict_types=1);

namespace App\Providers;

use App\Infrastructure\AI\ClaudeProvider;
use App\Infrastructure\AI\OpenAiProvider;
use App\Shared\Contracts\AiProviderInterface;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->bindAiProvider();
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }

    private function bindAiProvider(): void
    {
        $this->app->bind(AiProviderInterface::class, function () {
            return match (config('ai.provider', 'claude')) {
                'openai' => $this->app->make(OpenAiProvider::class),
                default  => $this->app->make(ClaudeProvider::class),
            };
        });
    }
}
