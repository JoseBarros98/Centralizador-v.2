<?php

declare(strict_types=1);

namespace App\Infrastructure\AI;

use App\Shared\Contracts\AiProviderInterface;
use App\Shared\DTOs\AiResponseDTO;
use App\Shared\Exceptions\ExternalServiceException;
use Illuminate\Http\Client\Factory as Http;

final class ClaudeProvider implements AiProviderInterface
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';
    private const DEFAULT_MODEL = 'claude-sonnet-4-6';

    public function __construct(private readonly Http $http) {}

    public function chat(string $message, array $history = [], ?string $contextType = null, ?string $contextId = null): AiResponseDTO
    {
        $messages = array_merge($history, [['role' => 'user', 'content' => $message]]);

        return $this->request($messages);
    }

    public function analyze(string $content, string $prompt): AiResponseDTO
    {
        return $this->request([
            ['role' => 'user', 'content' => "$prompt\n\n$content"],
        ]);
    }

    public function generateDocument(string $template, array $data): AiResponseDTO
    {
        $prompt = "Generate a document using this template: $template\n\nData: " . json_encode($data);

        return $this->request([['role' => 'user', 'content' => $prompt]]);
    }

    private function request(array $messages): AiResponseDTO
    {
        $response = $this->http->withHeaders([
            'x-api-key' => config('services.claude.api_key'),
            'anthropic-version' => '2023-06-01',
        ])->post(self::API_URL, [
            'model' => config('services.claude.model', self::DEFAULT_MODEL),
            'max_tokens' => 4096,
            'messages' => $messages,
        ]);

        if ($response->failed()) {
            throw new ExternalServiceException('Claude', $response->body());
        }

        $data = $response->json();

        return new AiResponseDTO(
            content: $data['content'][0]['text'],
            inputTokens: $data['usage']['input_tokens'],
            outputTokens: $data['usage']['output_tokens'],
            model: $data['model'],
        );
    }
}
