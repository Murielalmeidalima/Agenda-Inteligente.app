import requests

url = "http://localhost:3000/api/admin/debug-db"
response = requests.get(url)
print("Status Code:", response.status_code)
print("Headers:", response.headers)
try:
    print("JSON:", response.json())
except Exception as e:
    print("Raw text:", response.text)
