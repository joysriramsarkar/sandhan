use axum::{extract::Query, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::{Mutex, OnceLock};

const STORE_PATH: &str = "data/sync_store.json";
static SYNC_STORE: OnceLock<Mutex<HashMap<String, AccountSyncData>>> = OnceLock::new();

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct AccountSyncData {
    pub auth_token: String,
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
    pub auth_token: Option<String>,
    pub salt: String,
}

#[derive(Deserialize)]
pub struct PullQuery {
    pub anon_id: String,
    pub auth_token: Option<String>,
    pub since: Option<u64>,
}

#[derive(Deserialize)]
pub struct PushBody {
    pub anon_id: String,
    pub auth_token: Option<String>,
    pub nonce: String,
    pub ct: String,
    pub ver: u64,
    pub entry_id: Option<String>,
}

#[derive(Deserialize)]
pub struct RecoveryBody {
    pub anon_id: String,
    pub auth_token: Option<String>,
    pub wrapped: String,
}

fn load_store_from_disk() -> HashMap<String, AccountSyncData> {
    if Path::new(STORE_PATH).exists() {
        if let Ok(data) = fs::read_to_string(STORE_PATH) {
            if let Ok(parsed) = serde_json::from_str::<HashMap<String, AccountSyncData>>(&data) {
                return parsed;
            }
        }
    }
    HashMap::new()
}

fn save_store_to_disk(store: &HashMap<String, AccountSyncData>) {
    if let Some(parent) = Path::new(STORE_PATH).parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(serialized) = serde_json::to_string_pretty(store) {
        let _ = fs::write(STORE_PATH, serialized);
    }
}

pub async fn register(Json(b): Json<RegBody>) -> StatusCode {
    let mut store = SYNC_STORE.get_or_init(|| Mutex::new(load_store_from_disk())).lock().unwrap();
    let auth_token = b.auth_token.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    store.entry(b.anon_id).or_insert_with(|| AccountSyncData {
        auth_token,
        salt: b.salt,
        entries: Vec::new(),
        recovery_wrapped: None,
    });
    save_store_to_disk(&store);
    StatusCode::OK
}

pub async fn pull(Query(q): Query<PullQuery>) -> Result<Json<Value>, StatusCode> {
    let store = SYNC_STORE.get_or_init(|| Mutex::new(load_store_from_disk())).lock().unwrap();
    let account = store.get(&q.anon_id).ok_or(StatusCode::NOT_FOUND)?;
    
    // Verify auth token if account was created with one
    if !account.auth_token.is_empty() {
        if let Some(ref client_token) = q.auth_token {
            if client_token != &account.auth_token {
                return Err(StatusCode::UNAUTHORIZED);
            }
        }
    }

    let since = q.since.unwrap_or(0);
    let items: Vec<&SyncEntry> = account.entries.iter().filter(|e| e.ver > since).collect();
    Ok(Json(json!({
        "salt": account.salt,
        "entries": items,
    })))
}

pub async fn push(Json(b): Json<PushBody>) -> StatusCode {
    let mut store = SYNC_STORE.get_or_init(|| Mutex::new(load_store_from_disk())).lock().unwrap();
    if let Some(account) = store.get_mut(&b.anon_id) {
        if !account.auth_token.is_empty() {
            if let Some(ref client_token) = b.auth_token {
                if client_token != &account.auth_token {
                    return StatusCode::UNAUTHORIZED;
                }
            }
        }

        let entry_id = b.entry_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        account.entries.retain(|e| e.entry_id != entry_id);
        account.entries.push(SyncEntry {
            entry_id,
            nonce: b.nonce,
            ct: b.ct,
            ver: b.ver,
            ts: std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
        });
        save_store_to_disk(&store);
        StatusCode::OK
    } else {
        StatusCode::NOT_FOUND
    }
}

pub async fn store_recovery(Json(b): Json<RecoveryBody>) -> StatusCode {
    let mut store = SYNC_STORE.get_or_init(|| Mutex::new(load_store_from_disk())).lock().unwrap();
    if let Some(account) = store.get_mut(&b.anon_id) {
        if !account.auth_token.is_empty() {
            if let Some(ref client_token) = b.auth_token {
                if client_token != &account.auth_token {
                    return StatusCode::UNAUTHORIZED;
                }
            }
        }

        account.recovery_wrapped = Some(b.wrapped);
        save_store_to_disk(&store);
        StatusCode::OK
    } else {
        StatusCode::NOT_FOUND
    }
}

pub async fn get_recovery(Query(q): Query<PullQuery>) -> Result<Json<Value>, StatusCode> {
    let store = SYNC_STORE.get_or_init(|| Mutex::new(load_store_from_disk())).lock().unwrap();
    let account = store.get(&q.anon_id).ok_or(StatusCode::NOT_FOUND)?;
    if !account.auth_token.is_empty() {
        if let Some(ref client_token) = q.auth_token {
            if client_token != &account.auth_token {
                return Err(StatusCode::UNAUTHORIZED);
            }
        }
    }
    Ok(Json(json!({ "wrapped": account.recovery_wrapped })))
}
