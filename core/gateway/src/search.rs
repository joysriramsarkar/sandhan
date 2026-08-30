use axum::{extract::Query, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Deserialize)]
pub struct SearchParams {
    pub q: Option<String>,
    pub lang: Option<String>,
}

#[derive(Deserialize)]
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

    let results = crate::aggregator::aggregate(&q, params.lang.as_deref().unwrap_or("bn")).await;
    let did_you_mean = crate::spellcheck::suggest_query(&q);

    Ok(Json(json!({
        "query": q,
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
    // Accept encrypted payload without inspecting content
    StatusCode::OK
}
