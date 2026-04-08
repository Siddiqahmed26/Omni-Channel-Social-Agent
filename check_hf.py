import requests
import json
import time

SPACE_ID = "siddiq262001/my-social-agent"
URL = f"https://huggingface.co/api/spaces/{SPACE_ID}"

def check_status():
    response = requests.get(URL)
    if response.status_code == 200:
        data = response.json()
        print(f"[{time.strftime('%X')}] Status: {data.get('runtime', {}).get('stage', 'Unknown')}")
    else:
        print(f"Error fetching status: {response.status_code}")

check_status()
