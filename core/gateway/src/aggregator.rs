use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Default)]
pub struct AggregatedResponse {
    pub items: Vec<SearchResultItem>,
    pub knowledge: Option<KnowledgePanel>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SearchResultItem {
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub source: String,
    pub score: f32,
    pub signals: ResultSignals,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct ResultSignals {
    pub bm25: f32,
    pub freshness: f32,
    pub authority: f32,
    pub explanation: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct KnowledgePanel {
    pub title: String,
    pub subtitle: Option<String>,
    pub description: String,
    pub thumbnail: Option<String>,
    pub attributes: Vec<(String, String)>,
    pub source_url: String,
}

fn compute_bm25_score(query: &str, title: &str, snippet: &str) -> f32 {
    let q_terms: Vec<&str> = query.split_whitespace().collect();
    if q_terms.is_empty() {
        return 0.5;
    }
    let title_lower = title.to_lowercase();
    let snippet_lower = snippet.to_lowercase();

    let mut matches = 0.0;
    for t in &q_terms {
        let t_lower = t.to_lowercase();
        if title_lower.contains(&t_lower) {
            matches += 2.0;
        }
        if snippet_lower.contains(&t_lower) {
            matches += 1.0;
        }
    }
    let raw = matches / (q_terms.len() as f32 * 3.0);
    (0.3 + raw * 0.68).min(0.99)
}

pub async fn aggregate(query: &str, lang: &str) -> AggregatedResponse {
    let client = match reqwest::Client::builder().build() {
        Ok(c) => c,
        Err(_) => reqwest::Client::new(),
    };

    let wiki_lang = if lang == "hi" {
        "hi"
    } else if lang == "en" {
        "en"
    } else {
        "bn"
    };

    let api_url = format!(
        "https://{}.wikipedia.org/w/api.php?action=query&list=search&srsearch={}&utf8=&format=json&srlimit=10",
        wiki_lang,
        urlencoding::encode(query)
    );

    let mut items = Vec::new();
    if let Ok(res) = client.get(&api_url).send().await {
        if let Ok(data) = res.json::<Value>().await {
            if let Some(list) = data["query"]["search"].as_array() {
                for (idx, item) in list.iter().enumerate() {
                    let title = item["title"].as_str().unwrap_or_default().to_string();
                    let snippet = item["snippet"]
                        .as_str()
                        .unwrap_or_default()
                        .replace("<span class=\"searchmatch\">", "")
                        .replace("</span>", "");
                    let url = format!(
                        "https://{}.wikipedia.org/wiki/{}",
                        wiki_lang,
                        urlencoding::encode(&title)
                    );

                    let bm25 = compute_bm25_score(query, &title, &snippet);
                    let authority = if url.contains(".edu") || url.contains("wikipedia.org") {
                        0.98
                    } else {
                        0.85
                    };
                    let freshness = 0.85;
                    let score = (bm25 * 0.6 + authority * 0.3 + freshness * 0.1) - (idx as f32 * 0.02);

                    items.push(SearchResultItem {
                        title: title.clone(),
                        url,
                        snippet,
                        source: format!("Wikipedia ({})", wiki_lang.to_uppercase()),
                        score: score.max(0.1),
                        signals: ResultSignals {
                            bm25,
                            freshness,
                            authority,
                            explanation: format!("Wikipedia article match score {:.0}% for '{query}'", bm25 * 100.0),
                        },
                    });
                }
            }
        }
    }

    let knowledge = if !items.is_empty() {
        Some(KnowledgePanel {
            title: items[0].title.clone(),
            subtitle: Some(if wiki_lang == "bn" {
                "উইকিপিডিয়া উন্মুক্ত জ্ঞানকোষ".to_string()
            } else if wiki_lang == "hi" {
                "विकिपीडिया मुक्त ज्ञानकोश".to_string()
            } else {
                "Wikipedia Knowledge Base".to_string()
            }),
            description: items[0].snippet.clone(),
            thumbnail: None,
            attributes: vec![
                ("Source".to_string(), format!("Wikipedia ({wiki_lang})")),
                ("License".to_string(), "CC BY-SA 4.0".to_string()),
            ],
            source_url: items[0].url.clone(),
        })
    } else {
        None
    };

    AggregatedResponse { items, knowledge }
}
