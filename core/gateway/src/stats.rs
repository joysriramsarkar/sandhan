use axum::Json;
use serde_json::{json, Value};
use crate::metrics;

pub async fn get_stats() -> Json<Value> {
    let uptime_secs = metrics::get_uptime_secs();
    let avg_latency = metrics::get_avg_latency_ms();
    let total_reqs = metrics::REQ_COUNT.load(std::sync::atomic::Ordering::Relaxed);
    let total_errs = metrics::ERR_COUNT.load(std::sync::atomic::Ordering::Relaxed);

    let uptime_pct = if total_reqs > 0 {
        ((total_reqs - total_errs) as f64 / total_reqs as f64) * 100.0
    } else {
        100.0
    };

    Json(json!({
        "status": "healthy",
        "version": "0.1.0",
        "codename": "প্রথম ভোর (First Dawn)",
        "uptime_seconds": uptime_secs,
        "uptime_percentage": format!("{:.2}%", uptime_pct),
        "requests_total": total_reqs,
        "errors_total": total_errs,
        "average_latency_ms": format!("{:.2} ms", avg_latency),
        "privacy_guarantee": "Zero persistent query logs, client-side AES-256-GCM encryption",
        "active_backend": "Sandhan Axum Privacy Gateway"
    }))
}
