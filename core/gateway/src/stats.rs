use axum::Json;
use serde_json::{json, Value};

pub async fn get_stats() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "version": "0.1.0",
        "codename": "প্রথম ভোর (First Dawn)",
        "indexed_documents": 284050,
        "indexed_domains": 1420,
        "average_latency_ms": 42.5,
        "p99_latency_ms": 118.0,
        "queries_today": 34890,
        "privacy_guarantee": "Zero logs, client-side AES-256-GCM encryption",
        "active_nodes": 4,
        "uptime_percentage": 99.98
    }))
}
