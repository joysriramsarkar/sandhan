use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;
use std::sync::OnceLock;

static START_TIME: OnceLock<Instant> = OnceLock::new();
pub static REQ_COUNT: AtomicU64 = AtomicU64::new(0);
pub static ERR_COUNT: AtomicU64 = AtomicU64::new(0);
pub static TOTAL_LATENCY_US: AtomicU64 = AtomicU64::new(0);

pub fn init_metrics() {
    START_TIME.get_or_init(Instant::now);
}

pub fn record_request(latency_us: u64, is_err: bool) {
    REQ_COUNT.fetch_add(1, Ordering::Relaxed);
    TOTAL_LATENCY_US.fetch_add(latency_us, Ordering::Relaxed);
    if is_err {
        ERR_COUNT.fetch_add(1, Ordering::Relaxed);
    }
}

pub fn get_uptime_secs() -> u64 {
    START_TIME.get_or_init(Instant::now).elapsed().as_secs()
}

pub fn get_avg_latency_ms() -> f64 {
    let reqs = REQ_COUNT.load(Ordering::Relaxed);
    if reqs == 0 {
        return 0.0;
    }
    let total_us = TOTAL_LATENCY_US.load(Ordering::Relaxed);
    (total_us as f64 / reqs as f64) / 1000.0
}

pub async fn prometheus() -> String {
    let reqs = REQ_COUNT.load(Ordering::Relaxed);
    let errs = ERR_COUNT.load(Ordering::Relaxed);
    let avg_latency = get_avg_latency_ms();
    let uptime = get_uptime_secs();

    format!(
        "# HELP sandhan_requests_total Total HTTP requests processed\n\
         # TYPE sandhan_requests_total counter\n\
         sandhan_requests_total {}\n\
         # HELP sandhan_errors_total Total errors encountered\n\
         # TYPE sandhan_errors_total counter\n\
         sandhan_errors_total {}\n\
         # HELP sandhan_avg_latency_ms Average request latency in milliseconds\n\
         # TYPE sandhan_avg_latency_ms gauge\n\
         sandhan_avg_latency_ms {:.2}\n\
         # HELP sandhan_uptime_seconds Process uptime in seconds\n\
         # TYPE sandhan_uptime_seconds gauge\n\
         sandhan_uptime_seconds {}\n",
        reqs, errs, avg_latency, uptime
    )
}
