use axum::{extract::Query, Json};
use sandhan_nlp::SpellChecker;
use serde_json::{json, Value};
use std::sync::OnceLock;

static SPELLCHECKER: OnceLock<SpellChecker> = OnceLock::new();

fn get_checker() -> &'static SpellChecker {
    SPELLCHECKER.get_or_init(|| {
        let corpus = vec![
            ("বাংলাদেশ".to_string(), 10000),
            ("রবীন্দ্রনাথ".to_string(), 8500),
            ("ভাষা".to_string(), 9000),
            ("গীতাঞ্জলি".to_string(), 7000),
            ("মুক্তিযুদ্ধ".to_string(), 9500),
            ("নোবেল".to_string(), 8000),
            ("পদ্মা".to_string(), 7500),
            ("সেতু".to_string(), 7200),
            ("ঢাকা".to_string(), 9900),
            ("শহর".to_string(), 8800),
            ("কলকাতা".to_string(), 8600),
            ("বিজ্ঞান".to_string(), 8900),
            ("প্রযুক্তি".to_string(), 9100),
            ("বিশ্ববিদ্যালয়".to_string(), 8700),
            ("ইতিহাস".to_string(), 8300),
            ("সাহিত্য".to_string(), 8400),
        ];
        SpellChecker::from_words(corpus.into_iter())
    })
}

pub fn suggest_query(q: &str) -> Option<String> {
    let words: Vec<&str> = q.split_whitespace().collect();
    let checker = get_checker();
    let mut corrected = Vec::new();
    let mut changed = false;

    for w in words {
        if let Some(sug) = checker.suggest(w) {
            if sug != w {
                changed = true;
                corrected.push(sug);
                continue;
            }
        }
        corrected.push(w.to_string());
    }

    if changed {
        Some(corrected.join(" "))
    } else {
        None
    }
}

pub async fn spell(Query(p): Query<crate::search::SearchParams>) -> Json<Value> {
    let q = p.q.unwrap_or_default();
    let did_you_mean = suggest_query(&q);
    Json(json!({
        "q": q,
        "did_you_mean": did_you_mean
    }))
}
