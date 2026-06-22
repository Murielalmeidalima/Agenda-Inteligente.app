import requests
import json

url = "https://nvcmrsvrezjetppopjwy.supabase.co/rest/v1/"
headers = {
    "apikey": "sb_publishable_Uqok7K_fivEfzsAEi3hNnw_H5CK_cTC",
    "Authorization": "Bearer sb_publishable_Uqok7K_fivEfzsAEi3hNnw_H5CK_cTC"
}

response = requests.get(url, headers=headers)
print("Status Code:", response.status_code)
if response.status_code == 200:
    data = response.json()
    paths = data.get("definitions", {})
    profiles_def = paths.get("profiles", {})
    properties = profiles_def.get("properties", {})
    print("Profiles properties:")
    for prop, val in properties.items():
        print(f" - {prop}: {val.get('type')} ({val.get('description', '')})")
else:
    print("Response:", response.text)
