package com.vartalaab.api.repository;

import com.vartalaab.api.model.TranslationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TranslationHistoryRepository extends JpaRepository<TranslationHistory, Long> {

    @Query("""
        SELECT t FROM TranslationHistory t
        WHERE (:query IS NULL OR LOWER(t.sourceText) LIKE LOWER(CONCAT('%',:query,'%'))
               OR LOWER(t.translatedText) LIKE LOWER(CONCAT('%',:query,'%')))
        AND (:lang IS NULL OR t.sourceLang = :lang OR t.targetLang = :lang)
        ORDER BY t.createdAt DESC
        """)
    Page<TranslationHistory> search(
        @Param("query") String query,
        @Param("lang") String lang,
        Pageable pageable
    );

    long countByTargetLang(String targetLang);
}
