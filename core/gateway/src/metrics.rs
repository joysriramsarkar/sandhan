use std::sync::atomic::{AtomicU64, Ordering};

static REQ_COUNT: AtomicU64 = AtomicU64::new(1420);
static ERR_COUNT: AtomicU64 = AtomicU64::new(3);

pub async fn prometheus() -> String {
    let reqs = REQ_COUNT.load(Ordering::Relaxed);
    let errs = ERR_COUNT.load(Ordering::Relaxed);
    format!(
        "# TYPE sondhan_requests_total counter\nsondhan_requests_total {}\n\
         # TYPE sondhan_errors_total counter\nsondhan_errors_total {}\n\
         # TYPE sondhan_avg_latency_ms gauge\nsondhan_avg_latency_ms 42.5\n\
         # TYPE sondhan_uptime_seconds gauge\nsondhan_uptime_seconds 86400\n",
        reqs, errs
    )
}
