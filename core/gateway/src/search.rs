use axum::{extract::Query, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Deserialize, Debug)]
pub struct SearchParams {
    pub q: Option<String>,
    pub lang: Option<String>,
    pub category: Option<String>,
    pub page: Option<usize>,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct HistoryBlob {
    pub anon_id: String,
    pub nonce: String,
    pub ciphertext: String,
}

pub async fn search(Query(params): Query<SearchParams>) -> Result<Json<Value>, StatusCode> {
    let q = params.q.unwrap_or_default().trim().to_string();
    if q.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let lang = params.lang.as_deref().unwrap_or("bn");
    let page = params.page.unwrap_or(1);
    let results = crate::aggregator::aggregate(&q, lang).await;
    let did_you_mean = crate::spellcheck::suggest_query(&q);

    Ok(Json(json!({
        "query": q,
        "category": params.category.as_deref().unwrap_or("all"),
        "lang": lang,
        "page": page,
        "results": results.items,
        "knowledge": results.knowledge,
        "did_you_mean": did_you_mean,
        "total": results.items.len(),
    })))
}

pub async fn store_history(Json(blob): Json<HistoryBlob>) -> impl IntoResponse {
    if blob.ciphertext.len() > 65536 {
        return StatusCode::PAYLOAD_TOO_LARGE;
    }
    // Save to sync store for anonymous account
    let _ = crate::sync::push(Json(crate::sync::PushBody {
        anon_id: blob.anon_id,
        auth_token: None,
        nonce: blob.nonce,
        ct: blob.ciphertext,
        ver: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        entry_id: None,
    }))
    .await;

    StatusCode::OK
}
