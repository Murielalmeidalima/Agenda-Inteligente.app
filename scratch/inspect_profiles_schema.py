import requests
import json

url = "https://nvcmrsvrezjetppopjwy.supabase.co/rest/v1/profiles"
headers = {
    "apikey": "sb_publishable_Uqok7K_fivEfzsAEi3hNnw_H5CK_cTC",
    "Authorization": "Bearer sb_publishable_Uqok7K_fivEfzsAEi3hNnw_H5CK_cTC"
}

# Fetch first profile to inspect columns and values
response = requests.get(url + "?limit=5", headers=headers)
print("Status Code:", response.status_code)
if response.status_code == 200:
    profiles = response.json()
    print("Profiles found:", len(profiles))
    if profiles:
        print("First profile keys and values:")
        for k, v in profiles[0].items():
            print(f" - {k}: {v} (Type: {type(v).__name__})")
        print("\nAll profiles roles and status:")
        for idx, p in enumerate(profiles):
            print(f"[{idx}] name={p.get('full_name')}, role={p.get('role')}, status={p.get('status')}")
else:
    print("Response:", response.text)
