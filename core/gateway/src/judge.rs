use axum::{http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Mutex, OnceLock};

const JUDGMENTS_PATH: &str = "data/judgments.json";
static JUDGMENTS: OnceLock<Mutex<Vec<JudgmentRecord>>> = OnceLock::new();
static TASK_COUNTER: AtomicUsize = AtomicUsize::new(0);

#[derive(Clone, Serialize, Deserialize)]
pub struct JudgmentRecord {
    pub query: String,
    pub doc_url: String,
    pub grade: u8,
    pub timestamp: u64,
}

#[derive(Deserialize)]
pub struct SubmitJudgmentPayload {
    pub query: String,
    pub doc_url: String,
    pub grade: u8,
}

fn load_judgments() -> Vec<JudgmentRecord> {
    if Path::new(JUDGMENTS_PATH).exists() {
        if let Ok(data) = fs::read_to_string(JUDGMENTS_PATH) {
            if let Ok(records) = serde_json::from_str::<Vec<JudgmentRecord>>(&data) {
                return records;
            }
        }
    }
    Vec::new()
}

fn save_judgments(list: &[JudgmentRecord]) {
    if let Some(p) = Path::new(JUDGMENTS_PATH).parent() {
        let _ = fs::create_dir_all(p);
    }
    if let Ok(ser) = serde_json::to_string_pretty(list) {
        let _ = fs::write(JUDGMENTS_PATH, ser);
    }
}

pub async fn get_task() -> Json<Value> {
    let pool = [
        (
            "রবীন্দ্রনাথ ঠাকুর",
            "https://bn.wikipedia.org/wiki/রবীন্দ্রনাথ_ঠাকুর",
            "রবীন্দ্রনাথ ঠাকুর - বাংলা উইকিপিডিয়া",
            "রবীন্দ্রনাথ ঠাকুর (৭ মে ১৮৬১ – ৭ আগস্ট ১৯৪১) ছিলেন একজন বাঙালি বহুবিদ্যাবিশারদ, কবি, সুরকার, ঔপন্যাসিক ও চিত্রশিল্পী।"
        ),
        (
            "পদ্মা সেতু",
            "https://bn.wikipedia.org/wiki/পদ্মা_সেতু",
            "পদ্মা সেতু - বাংলা উইকিপিডিয়া",
            "পদ্মা সেতু বাংলাদেশের পদ্মা নদীর উপর নির্মিত একটি বহুমুখী সড়ক ও রেল সেতু।"
        ),
        (
            "Python Programming",
            "https://www.python.org",
            "Python Programming Language - Official Website",
            "Python is an interpreted, high-level and general-purpose programming language. Its design philosophy emphasizes code readability."
        ),
        (
            "বাংলা বর্ণমালা",
            "https://bn.wikipedia.org/wiki/বাংলা_বর্ণমালা",
            "বাংলা বর্ণমালা ও লিপি",
            "বাংলা বর্ণমালা হলো বাংলা ভাষার জন্য ব্যবহৃত লিপি ব্যবস্থা, যাতে ১১টি স্বরবর্ণ ও ৩৯টি ব্যঞ্জনবর্ণ রয়েছে।"
        ),
        (
            "Quantum Computing",
            "https://en.wikipedia.org/wiki/Quantum_computing",
            "Quantum Computing - Wikipedia",
            "Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers."
        )
    ];

    let idx = TASK_COUNTER.fetch_add(1, Ordering::Relaxed) % pool.len();
    let (query, url, title, snippet) = pool[idx];

    Json(json!({
        "task_id": idx + 1,
        "query": query,
        "doc_url": url,
        "title": title,
        "snippet": snippet
    }))
}

pub async fn submit_judgment(Json(payload): Json<SubmitJudgmentPayload>) -> StatusCode {
    if payload.grade > 3 {
        return StatusCode::BAD_REQUEST;
    }
    let mut list = JUDGMENTS.get_or_init(|| Mutex::new(load_judgments())).lock().unwrap();
    list.push(JudgmentRecord {
        query: payload.query,
        doc_url: payload.doc_url,
        grade: payload.grade,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    });
    save_judgments(&list);
    StatusCode::OK
}
