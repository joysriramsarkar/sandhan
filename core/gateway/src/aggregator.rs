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

pub async fn aggregate(query: &str, lang: &str) -> AggregatedResponse {
    let client = reqwest::Client::builder().build().unwrap();
    let wiki_lang = if lang == "en" { "en" } else { "bn" };
    let api_url = format!(
        "https://{}.wikipedia.org/w/api.php?action=query&list=search&srsearch={}&utf8=&format=json&srlimit=8",
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
                    let url = format!("https://{}.wikipedia.org/wiki/{}", wiki_lang, urlencoding::encode(&title));
                    let score = 1.0 - (idx as f32 * 0.08);

                    items.push(SearchResultItem {
                        title: title.clone(),
                        url,
                        snippet,
                        source: format!("Wikipedia ({})", wiki_lang.to_uppercase()),
                        score,
                        signals: ResultSignals {
                            bm25: 0.85 - (idx as f32 * 0.05),
                            freshness: 0.70,
                            authority: 0.95,
                            explanation: format!("Wikipedia article match for '{query}'"),
                        },
                    });
                }
            }
        }
    }

    let knowledge = if !items.is_empty() {
        Some(KnowledgePanel {
            title: items[0].title.clone(),
            subtitle: Some("উইকিপিডিয়া ও উন্মুক্ত জ্ঞানভাণ্ডার".to_string()),
            description: items[0].snippet.clone(),
            thumbnail: None,
            attributes: vec![
                ("উৎস".to_string(), "উইকিপিডিয়া".to_string()),
                ("ভাষা".to_string(), wiki_lang.to_string()),
            ],
            source_url: items[0].url.clone(),
        })
    } else {
        None
    };

    AggregatedResponse { items, knowledge }
}

mod urlencoding {
    pub fn encode(s: &str) -> String {
        s.replace(' ', "_")
    }
}
