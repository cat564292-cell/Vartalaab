package com.vartalaab.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "translation_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranslationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 5000)
    private String sourceText;

    @Column(nullable = false, length = 5000)
    private String translatedText;

    @Column(nullable = false, length = 20)
    private String sourceLang;

    @Column(nullable = false, length = 20)
    private String targetLang;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
