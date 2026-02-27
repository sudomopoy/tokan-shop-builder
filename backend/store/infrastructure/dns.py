import requests

api_key: str = "b3635193-123a-5859-ab81-15dc4f196a62"

def create_cname_record(
    domain: str,
    name: str,
    host: str,
    host_header: str = "source",
    port: int = 1,
    ttl: int = 120,
    cloud: bool = False,
    upstream_https: str = "default",
    ip_filter_mode: dict = None,
) -> dict:
    """
    Create a CNAME record in ArvanCloud CDN

    Args:
        domain: Domain name (e.g., 'example.com')
        api_key: ArvanCloud API key (JWT token)
        name: Record name (<= 250 chars)
        host: Target host (e.g., 'cdn.example.com')
        host_header: Host header value
        port: Port number
        ttl: TTL value (from enum values)
        cloud: Cloud protection status
        upstream_https: Upstream HTTPS mode
        ip_filter_mode: IP filter mode settings

    Returns:
        API response as dict
    """
    try:
        if ip_filter_mode is None:
            ip_filter_mode = {"count": "single", "order": "none", "geo_filter": "none"}

        url = f"https://napi.arvancloud.ir/cdn/4.0/domains/{domain}/dns-records"

        headers = {"Authorization": f"apikey {api_key}", "Content-Type": "application/json"}

        payload = {
            "value": {"host": host, "host_header": host_header, "port": port},
            "type": "cname",
            "name": name,
            "ttl": ttl,
            "cloud": cloud,
            "upstream_https": upstream_https,
            "ip_filter_mode": ip_filter_mode,
        }

        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise exception for HTTP errors
        return response.json()["data"]["id"]
    except Exception as e:
        print(e)
        return False

# response = create_cname_record(
#     domain="tokan.app",
#     name="_acme-challenge",
#     host="a3aed581-3ebe-45de-b059-faef382ec5f3.auth.acme-dns.io",
#     cloud=False,
# )
# print(response)
