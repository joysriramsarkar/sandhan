use axum::{extract::Request, middleware::Next, response::Response};
use std::net::IpAddr;
use uuid::Uuid;

#[derive(Clone, Copy, Debug)]
pub struct RequestId(pub Uuid);

pub fn truncate_ip(ip: IpAddr) -> String {
    match ip {
        IpAddr::V4(v4) => {
            let o = v4.octets();
            format!("{}.{}.{}.0", o[0], o[1], o[2])
        }
        IpAddr::V6(v6) => {
            let s = v6.segments();
            format!("{:x}:{:x}:{:x}::", s[0], s[1], s[2])
        }
    }
}

pub async fn ephemeral_request(mut req: Request, next: Next) -> Response {
    let req_id = RequestId(Uuid::new_v4());
    req.extensions_mut().insert(req_id);
    let mut resp = next.run(req).await;
    resp.headers_mut().insert(
        "x-sandhan-privacy",
        "zero-logs; ip-truncated; encrypted-history".parse().unwrap(),
    );
    resp
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{Ipv4Addr, Ipv6Addr};

    #[test]
    fn ipv4_truncate_test() {
        let ip = IpAddr::V4(Ipv4Addr::new(203, 0, 113, 42));
        assert_eq!(truncate_ip(ip), "203.0.113.0");
    }

    #[test]
    fn ipv6_truncate_test() {
        let ip = IpAddr::V6(Ipv6Addr::new(0x2001, 0xdb8, 0x1234, 0x5678, 0xaaaa, 0xbbbb, 0xcccc, 0xdddd));
        assert_eq!(truncate_ip(ip), "2001:db8:1234::");
    }
}
