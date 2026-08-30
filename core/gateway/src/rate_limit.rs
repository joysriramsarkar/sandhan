use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

static BUCKETS: OnceLock<Mutex<HashMap<String, Bucket>>> = OnceLock::new();

#[derive(Default)]
struct Bucket {
    tokens: f64,
    last: Instant,
}

const CAP: f64 = 60.0;
const RATE: f64 = 10.0;

pub async fn limit(req: Request, next: Next) -> Response {
    let prefix = req
        .extensions()
        .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
        .map(|c| crate::privacy::truncate_ip(c.0.ip()))
        .unwrap_or_else(|| "unknown".into());

    let ok = {
        let mut m = BUCKETS.get_or_init(|| Mutex::new(HashMap::new())).lock().unwrap();
        if m.len() > 10_000 {
            m.retain(|_, b| b.last.elapsed() < Duration::from_secs(3600));
        }
        let b = m.entry(prefix).or_default();
        b.tokens = (b.tokens + b.last.elapsed().as_secs_f64() * RATE).min(CAP);
        b.last = Instant::now();
        if b.tokens >= 1.0 {
            b.tokens -= 1.0;
            true
        } else {
            false
        }
    };

    if !ok {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    }
    next.run(req).await
}
