use axum::{extract::Query, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};

static SYNC_STORE: OnceLock<Mutex<HashMap<String, AccountSyncData>>> = OnceLock::new();

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct AccountSyncData {
    pub salt: String,
    pub entries: Vec<SyncEntry>,
    pub recovery_wrapped: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SyncEntry {
    pub entry_id: String,
    pub nonce: String,
    pub ct: String,
    pub ver: u64,
    pub ts: u64,
}

#[derive(Deserialize)]
pub struct RegBody {
    pub anon_id: String,
    pub salt: String,
}

#[derive(Deserialize)]
pub struct PullQuery {
    pub anon_id: String,
    pub since: Option<u64>,
}

#[derive(Deserialize)]
pub struct PushBody {
    pub anon_id: String,
    pub nonce: String,
    pub ct: String,
    pub ver: u64,
    pub entry_id: Option<String>,
}

#[derive(Deserialize)]
pub struct RecoveryBody {
    pub anon_id: String,
    pub wrapped: String,
}

pub async fn register(Json(b): Json<RegBody>) -> StatusCode {
    let mut store = SYNC_STORE.get_or_init(|| Mutex::new(HashMap::new())).lock().unwrap();
    store.entry(b.anon_id).or_insert_with(|| AccountSyncData {
        salt: b.salt,
        entries: Vec::new(),
        recovery_wrapped: None,
    });
    StatusCode::OK
}

pub async fn pull(Query(q): Query<PullQuery>) -> Result<Json<Value>, StatusCode> {
    let store = SYNC_STORE.get_or_init(|| Mutex::new(HashMap::new())).lock().unwrap();
    let account = store.get(&q.anon_id).ok_or(StatusCode::NOT_FOUND)?;
    let since = q.since.unwrap_or(0);
    let items: Vec<&SyncEntry> = account.entries.iter().filter(|e| e.ver > since).collect();
    Ok(Json(json!({
        "salt": account.salt,
        "entries": items,
    })))
}

pub async fn push(Json(b): Json<PushBody>) -> StatusCode {
    let mut store = SYNC_STORE.get_or_init(|| Mutex::new(HashMap::new())).lock().unwrap();
    if let Some(account) = store.get_mut(&b.anon_id) {
        let entry_id = b.entry_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        account.entries.retain(|e| e.entry_id != entry_id);
        account.entries.push(SyncEntry {
            entry_id,
            nonce: b.nonce,
            ct: b.ct,
            ver: b.ver,
            ts: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
        });
        StatusCode::OK
    } else {
        StatusCode::NOT_FOUND
    }
}

pub async fn store_recovery(Json(b): Json<RecoveryBody>) -> StatusCode {
    let mut store = SYNC_STORE.get_or_init(|| Mutex::new(HashMap::new())).lock().unwrap();
    if let Some(account) = store.get_mut(&b.anon_id) {
        account.recovery_wrapped = Some(b.wrapped);
        StatusCode::OK
    } else {
        StatusCode::NOT_FOUND
    }
}

pub async fn get_recovery(Query(q): Query<PullQuery>) -> Result<Json<Value>, StatusCode> {
    let store = SYNC_STORE.get_or_init(|| Mutex::new(HashMap::new())).lock().unwrap();
    let account = store.get(&q.anon_id).ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(json!({ "wrapped": account.recovery_wrapped })))
}
