use axum::{http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::{Mutex, OnceLock};

static JUDGMENTS: OnceLock<Mutex<Vec<JudgmentRecord>>> = OnceLock::new();

#[derive(Clone, Serialize, Deserialize)]
pub struct JudgmentRecord {
    pub query: String,
    pub doc_url: String,
    pub grade: u8, // 0 = irrelevant, 1 = somewhat relevant, 2 = highly relevant, 3 = perfect
    pub timestamp: u64,
}

#[derive(Deserialize)]
pub struct SubmitJudgmentPayload {
    pub query: String,
    pub doc_url: String,
    pub grade: u8,
}

pub async fn get_task() -> Json<Value> {
    // Return sample candidate pair for anonymous human judging
    Json(json!({
        "query": "রবীন্দ্রনাথ ঠাকুর",
        "doc_url": "https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর",
        "title": "রবীন্দ্রনাথ ঠাকুর - উইকিপিডিয়া",
        "snippet": "রবীন্দ্রনাথ ঠাকুর (৭ মে ১৮৬১ – ৭ আগস্ট ১৯৪১) ছিলেন একজন বাঙালি বহুবিদ্যাবিশারদ, কবি, সুরকার, এবং চিত্রশিল্পী যিনি বাংলা সাহিত্য ও সংগীতকে পুনর্গঠিত করেছিলেন।"
    }))
}

pub async fn submit_judgment(Json(payload): Json<SubmitJudgmentPayload>) -> StatusCode {
    if payload.grade > 3 {
        return StatusCode::BAD_REQUEST;
    }
    let mut judgments = JUDGMENTS.get_or_init(|| Mutex::new(Vec::new())).lock().unwrap();
    judgments.push(JudgmentRecord {
        query: payload.query,
        doc_url: payload.doc_url,
        grade: payload.grade,
        timestamp: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
    });
    StatusCode::OK
}
