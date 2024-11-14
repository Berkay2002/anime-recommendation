// frontend/components/worker.js

import cosineSimilarity from 'cosine-similarity';

self.onmessage = function (e) {
  const { selectedEmbedding, allEmbeddings, selectedTitle } = e.data;

  const weights = {
    bert_description: 0.25,
    bert_genres: 0.25,
    bert_demographic: 0.15,
    bert_rating: 0.10,
    bert_themes: 0.25
  };

  const weightedEmbedding = (embedding, weights) => {
    return [
      ...(embedding.bert_description || []).map(value => value * weights.bert_description),
      ...(embedding.bert_genres || []).map(value => value * weights.bert_genres),
      ...(embedding.bert_demographic || []).map(value => value * weights.bert_demographic),
      ...(embedding.bert_rating || []).map(value => value * weights.bert_rating),
      ...(embedding.bert_themes || []).map(value => value * weights.bert_themes),
    ];
  };

  const extractBaseTitle = (title) => {
    return title
      .replace(/(?:Season|Saison|Part|:|-|\().*$/, '') // Remove content after common separators and keywords
      .replace(/\s+\d+(st|nd|rd|th)?\s*season/i, '') // Remove season numbers
      .replace(/\s+\d+$/, '') // Remove trailing numbers
      .replace(/\s+[IVXLCDM]+$/, '') // Remove trailing Roman numerals
      .trim(); // Trim whitespace
  };

  const selectedBaseTitle = extractBaseTitle(selectedTitle);
  const selectedWeightedEmbedding = weightedEmbedding(selectedEmbedding, weights);

  const similarities = allEmbeddings.map((embedding) => {
    const combinedEmbedding = weightedEmbedding(embedding, weights);
    return {
      anime_id: embedding.anime_id,
      title: embedding.title,
      similarity: cosineSimilarity(selectedWeightedEmbedding, combinedEmbedding),
    };
  });

  const filteredSimilarities = similarities.filter(sim => extractBaseTitle(sim.title) !== selectedBaseTitle);

  filteredSimilarities.sort((a, b) => b.similarity - a.similarity);

  self.postMessage(filteredSimilarities);
};