use axum::{middleware, routing::{get, post}, Router};
use std::net::SocketAddr;

mod aggregator;
mod judge;
mod metrics;
mod privacy;
mod rate_limit;
mod search;
mod spellcheck;
mod stats;
mod sync;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_target(false).init();
    metrics::init_metrics();

    let app = Router::new()
        .route("/healthz", get(|| async { "ok" }))
        .route("/api/search", get(search::search))
        .route("/api/spell", get(spellcheck::spell))
        .route("/api/history", post(search::store_history))
        .route("/api/sync/register", post(sync::register))
        .route("/api/sync/pull", get(sync::pull))
        .route("/api/sync/push", post(sync::push))
        .route("/api/sync/recovery", post(sync::store_recovery).get(sync::get_recovery))
        .route("/api/judge/task", get(judge::get_task))
        .route("/api/judge/submit", post(judge::submit_judgment))
        .route("/api/stats", get(stats::get_stats))
        .route("/metrics", get(metrics::prometheus))
        .layer(middleware::from_fn(privacy::ephemeral_request))
        .layer(middleware::from_fn(rate_limit::limit));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("সন্ধান গেটওয়ে চলছে: {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .unwrap();
}
