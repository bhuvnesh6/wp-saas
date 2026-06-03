import requests

url = "https://wpvo.phishnix.site/admin/send-message"

headers = {
    "x-api-key": "super445mgmh25gfshkknhjjkg323",
    "Content-Type": "application/json"
}

payload = {
    "instanceName": "Bhviss",
    "number": "917310790490",
    "message": "Hello from Python"
}

response = requests.post(
    url,
    headers=headers,
    json=payload,
    timeout=30
)

print("Status:", response.status_code)
print("Response:", response.text)