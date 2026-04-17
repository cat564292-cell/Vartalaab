package com.vartalaab.api.service;

import com.vartalaab.api.model.TranslationHistory;
import com.vartalaab.api.repository.TranslationHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranslationService {

    private final TranslationHistoryRepository historyRepo;
    private final WebClient.Builder webClientBuilder;

    @Value("${rapidapi.key}")
    private String rapidApiKey;

    private static final Map<String, String> LANG_MAP = Map.of(
        "zh-Hans", "zh-CN", "zh-Hant", "zh-TW"
    );

    private String toCode(String code) {
        return LANG_MAP.getOrDefault(code, code);
    }

    public record TranslateResult(String translatedText, String provider) {}

    public TranslateResult translate(String text, String from, String to) {
        String src = "auto".equals(from) ? "auto" : toCode(from);
        String tgt = toCode(to);

        // 1. Try RapidAPI (Google Translate via RapidAPI)
        try {
            String result = webClientBuilder.build()
                .post()
                .uri("https://google-translate113.p.rapidapi.com/api/v1/translator/text")
                .header("Content-Type", "application/json")
                .header("X-RapidAPI-Key", rapidApiKey)
                .header("X-RapidAPI-Host", "google-translate113.p.rapidapi.com")
                .bodyValue(Map.of("from", src, "to", tgt, "text", text.substring(0, Math.min(text.length(), 5000))))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (result != null) {
                String translated = (String) result.getOrDefault("trans",
                    result.getOrDefault("translation",
                    result.getOrDefault("translatedText", null)));
                if (translated != null && !translated.isBlank()) {
                    return new TranslateResult(translated, "rapidapi");
                }
            }
        } catch (Exception e) {
            log.warn("RapidAPI failed: {}", e.getMessage());
        }

        // 2. Fallback: MyMemory (free, no key)
        try {
            String mmSrc = "auto".equals(from) ? "en" : toCode(from);
            String query = text.substring(0, Math.min(text.length(), 450));
            Map<?, ?> mmResult = webClientBuilder.build()
                .get()
                .uri("https://api.mymemory.translated.net/get?q={q}&langpair={lp}",
                    java.net.URLEncoder.encode(query, "UTF-8"), mmSrc + "|" + tgt)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (mmResult != null) {
                Map<?, ?> data = (Map<?, ?>) mmResult.get("responseData");
                if (data != null && data.get("translatedText") != null) {
                    return new TranslateResult((String) data.get("translatedText"), "mymemory");
                }
            }
        } catch (Exception e) {
            log.warn("MyMemory failed: {}", e.getMessage());
        }

        throw new RuntimeException("All translation engines failed");
    }

    public TranslationHistory saveHistory(String source, String translated,
                                          String sourceLang, String targetLang, String provider) {
        return historyRepo.save(TranslationHistory.builder()
            .sourceText(source)
            .translatedText(translated)
            .sourceLang(sourceLang)
            .targetLang(targetLang)
            .provider(provider)
            .build());
    }
}
