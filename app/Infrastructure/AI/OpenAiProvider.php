<?php

declare(strict_types=1);

namespace App\Infrastructure\AI;

use App\Shared\Contracts\AiProviderInterface;
use App\Shared\DTOs\AiResponseDTO;
use App\Shared\Exceptions\ExternalServiceException;
use Illuminate\Http\Client\Factory as Http;

final class OpenAiProvider implements AiProviderInterface
{
    private const API_URL = 'https://api.openai.com/v1/chat/completions';
    private const DEFAULT_MODEL = 'gpt-4o';

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
        $response = $this->http->withToken(config('services.openai.api_key'))
            ->post(self::API_URL, [
                'model' => config('services.openai.model', self::DEFAULT_MODEL),
                'messages' => $messages,
            ]);

        if ($response->failed()) {
            throw new ExternalServiceException('OpenAI', $response->body());
        }

        $data = $response->json();

        return new AiResponseDTO(
            content: $data['choices'][0]['message']['content'],
            inputTokens: $data['usage']['prompt_tokens'],
            outputTokens: $data['usage']['completion_tokens'],
            model: $data['model'],
        );
    }
}
