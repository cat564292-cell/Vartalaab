package com.vartalaab.api.controller;

import com.vartalaab.api.model.TranslationHistory;
import com.vartalaab.api.repository.TranslationHistoryRepository;
import com.vartalaab.api.service.SmartSuggestionService;
import com.vartalaab.api.service.TranslationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VartalaabController {

    private final TranslationService translationService;
    private final SmartSuggestionService smartService;
    private final TranslationHistoryRepository historyRepo;

    // ── DTOs ──────────────────────────────────────────────────────────────────

    record TranslateRequest(
        @NotBlank String text,
        String fromLang,
        String toLang,
        boolean saveHistory
    ) {}

    record TranslateResponse(String translatedText, String provider, Long historyId) {}

    record SmartRequest(@NotBlank String text, String targetLang) {}

    record GrammarRequest(@NotBlank String text) {}

    // ── Health ────────────────────────────────────────────────────────────────

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "VarTalaab Spring Boot API", "version", "1.0");
    }

    // ── Translation ───────────────────────────────────────────────────────────

    @PostMapping("/translate")
    public ResponseEntity<TranslateResponse> translate(@Valid @RequestBody TranslateRequest req) {
        String from = req.fromLang() != null ? req.fromLang() : "auto";
        String to   = req.toLang()   != null ? req.toLang()   : "en";

        TranslationService.TranslateResult result = translationService.translate(req.text(), from, to);

        Long historyId = null;
        if (req.saveHistory()) {
            TranslationHistory saved = translationService.saveHistory(
                req.text(), result.translatedText(), from, to, result.provider());
            historyId = saved.getId();
        }

        return ResponseEntity.ok(new TranslateResponse(result.translatedText(), result.provider(), historyId));
    }

    // ── History ───────────────────────────────────────────────────────────────

    @GetMapping("/history")
    public ResponseEntity<Page<TranslationHistory>> getHistory(
        @RequestParam(required = false) String query,
        @RequestParam(required = false) String lang,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
            historyRepo.search(query, lang, PageRequest.of(page, size))
        );
    }

    @PostMapping("/history")
    public ResponseEntity<TranslationHistory> saveHistory(@RequestBody TranslationHistory item) {
        item.setId(null); // force insert
        return ResponseEntity.ok(historyRepo.save(item));
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id) {
        historyRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/history")
    public ResponseEntity<Void> clearHistory() {
        historyRepo.deleteAll();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/history/stats")
    public ResponseEntity<Map<String, Object>> historyStats() {
        return ResponseEntity.ok(Map.of(
            "total", historyRepo.count(),
            "languages", historyRepo.findAll().stream()
                .map(TranslationHistory::getTargetLang).distinct().count()
        ));
    }

    // ── Smart Suggestions ─────────────────────────────────────────────────────

    @PostMapping("/smart-suggest")
    public ResponseEntity<Map<String, Object>> smartSuggest(@Valid @RequestBody SmartRequest req) {
        List<SmartSuggestionService.Suggestion> suggestions =
            smartService.suggest(req.text(), req.targetLang() != null ? req.targetLang() : "en");
        return ResponseEntity.ok(Map.of("suggestions", suggestions));
    }

    // ── Grammar Check ─────────────────────────────────────────────────────────

    @PostMapping("/grammar-check")
    public ResponseEntity<Map<String, Object>> grammarCheck(@Valid @RequestBody GrammarRequest req) {
        List<SmartSuggestionService.GrammarError> errors = smartService.checkGrammar(req.text());
        return ResponseEntity.ok(Map.of("errors", errors, "hasErrors", !errors.isEmpty()));
    }
}
