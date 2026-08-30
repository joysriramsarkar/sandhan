use axum::{extract::Query, Json};
use serde_json::{json, Value};

pub fn suggest_query(q: &str) -> Option<String> {
    let corrections = [
        ("বাংলদেশ", "বাংলাদেশ"),
        ("রবিন্দ্রনাথ", "রবীন্দ্রনাথ"),
        ("ভাসা", "ভাষা"),
        ("গিতাঞ্জলি", "গীতাঞ্জলি"),
        ("মুক্তিযুধ", "মুক্তিযুদ্ধ"),
        ("নবেল", "নোবেল"),
        ("পদমা সেতু", "পদ্মা সেতু"),
        ("ঢকা শহর", "ঢাকা শহর"),
    ];

    for (wrong, right) in corrections {
        if q == wrong || q.contains(wrong) {
            return Some(q.replace(wrong, right));
        }
    }
    None
}

pub async fn spell(Query(p): Query<crate::search::SearchParams>) -> Json<Value> {
    let q = p.q.unwrap_or_default();
    let did_you_mean = suggest_query(&q);
    Json(json!({
        "q": q,
        "did_you_mean": did_you_mean
    }))
}
