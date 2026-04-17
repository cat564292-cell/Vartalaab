package com.vartalaab.api.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.*;

@Service
public class SmartSuggestionService {

    record GrammarRule(String pattern, String replacement, String message) {}

    private static final List<GrammarRule> GRAMMAR_RULES = List.of(
        new GrammarRule("\\bhe go\\b",      "he goes",    "Subject-verb agreement"),
        new GrammarRule("\\bshe go\\b",     "she goes",   "Subject-verb agreement"),
        new GrammarRule("\\bit go\\b",      "it goes",    "Subject-verb agreement"),
        new GrammarRule("\\bi goes\\b",     "I go",       "Subject-verb agreement"),
        new GrammarRule("\\bthey goes\\b",  "they go",    "Subject-verb agreement"),
        new GrammarRule("\\ba apple\\b",    "an apple",   "Article usage"),
        new GrammarRule("\\ba orange\\b",   "an orange",  "Article usage"),
        new GrammarRule("\\ban car\\b",     "a car",      "Article usage"),
        new GrammarRule("\\bim\\b",         "I'm",        "Contraction spelling"),
        new GrammarRule("\\bdont\\b",       "don't",      "Contraction spelling"),
        new GrammarRule("\\bcant\\b",       "can't",      "Contraction spelling"),
        new GrammarRule("\\bwont\\b",       "won't",      "Contraction spelling"),
        new GrammarRule("\\bisnt\\b",       "isn't",      "Contraction spelling"),
        new GrammarRule("\\barent\\b",      "aren't",     "Contraction spelling"),
        new GrammarRule("\\bwouldnt\\b",    "wouldn't",   "Contraction spelling"),
        new GrammarRule("\\bcouldnt\\b",    "couldn't",   "Contraction spelling"),
        new GrammarRule("\\bshouldnt\\b",   "shouldn't",  "Contraction spelling")
    );

    private static final Map<String, List<String>> AUTOCOMPLETE = Map.ofEntries(
        Map.entry("how are",    List.of("how are you?", "how are you doing?")),
        Map.entry("thank you",  List.of("thank you very much", "thank you for your help")),
        Map.entry("i would",    List.of("I would like to", "I would appreciate it")),
        Map.entry("nice to",    List.of("nice to meet you", "nice to see you again")),
        Map.entry("good",       List.of("good morning", "good afternoon", "good evening")),
        Map.entry("see you",    List.of("see you later", "see you soon")),
        Map.entry("can you",    List.of("can you help me?", "can you please explain?")),
        Map.entry("please",     List.of("please help me", "please translate this")),
        Map.entry("i am",       List.of("I am doing well", "I am happy to help"))
    );

    private static final Map<String, List<String>> SYNONYMS = Map.ofEntries(
        Map.entry("good",      List.of("great", "excellent", "wonderful")),
        Map.entry("bad",       List.of("poor", "terrible", "awful")),
        Map.entry("big",       List.of("large", "huge", "enormous")),
        Map.entry("small",     List.of("tiny", "compact", "petite")),
        Map.entry("happy",     List.of("joyful", "delighted", "pleased")),
        Map.entry("sad",       List.of("unhappy", "sorrowful", "melancholy")),
        Map.entry("fast",      List.of("quick", "rapid", "swift")),
        Map.entry("smart",     List.of("intelligent", "clever", "brilliant")),
        Map.entry("beautiful", List.of("gorgeous", "stunning", "lovely")),
        Map.entry("important", List.of("crucial", "essential", "vital"))
    );

    public record Suggestion(String id, String type, String text, String label) {}

    public List<Suggestion> suggest(String text, String targetLang) {
        List<Suggestion> suggestions = new ArrayList<>();
        if (text == null || text.isBlank()) return suggestions;

        // 1. Grammar corrections
        String corrected = text;
        List<String> changes = new ArrayList<>();
        for (GrammarRule rule : GRAMMAR_RULES) {
            Pattern p = Pattern.compile(rule.pattern(), Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(corrected);
            if (m.find()) {
                changes.add(rule.message());
                corrected = m.replaceAll(rule.replacement());
            }
        }
        if (!changes.isEmpty()) {
            suggestions.add(new Suggestion("grammar", "grammar", corrected,
                "Grammar: " + changes.get(0)));
        }

        // 2. Autocomplete
        String lower = text.toLowerCase();
        for (Map.Entry<String, List<String>> entry : AUTOCOMPLETE.entrySet()) {
            if (lower.endsWith(entry.getKey()) || lower.contains(entry.getKey() + " ")) {
                for (int i = 0; i < Math.min(2, entry.getValue().size()); i++) {
                    String completion = entry.getValue().get(i);
                    if (!lower.contains(completion.toLowerCase())) {
                        suggestions.add(new Suggestion(
                            "auto-" + entry.getKey() + "-" + i,
                            "autocomplete", completion, "Autocomplete"));
                    }
                }
            }
        }

        // 3. Synonyms
        String[] words = lower.split("\\s+");
        Set<String> seen = new HashSet<>();
        for (String word : words) {
            String clean = word.replaceAll("[^a-z]", "");
            if (SYNONYMS.containsKey(clean) && seen.add(clean)) {
                String syn = SYNONYMS.get(clean).get(0);
                String replaced = text.replaceAll("(?i)\\b" + clean + "\\b", syn);
                suggestions.add(new Suggestion(
                    "syn-" + clean, "synonym", replaced,
                    "Replace '" + clean + "' → '" + syn + "'"));
            }
        }

        return suggestions.subList(0, Math.min(suggestions.size(), 6));
    }

    public record GrammarError(int start, int end, String original, String suggestion, String message) {}

    public List<GrammarError> checkGrammar(String text) {
        List<GrammarError> errors = new ArrayList<>();
        for (GrammarRule rule : GRAMMAR_RULES) {
            Pattern p = Pattern.compile(rule.pattern(), Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(text);
            while (m.find()) {
                errors.add(new GrammarError(m.start(), m.end(),
                    m.group(), rule.replacement(), rule.message()));
            }
        }
        return errors;
    }
}
