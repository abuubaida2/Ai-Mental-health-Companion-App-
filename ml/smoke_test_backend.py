import json
import urllib.request

def post_text(text, url="http://127.0.0.1:8000/analyze-text"):
    payload = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode()

def main():
    try:
        print("Posting test text to /analyze-text...")
        resp = post_text("I feel a little anxious and happy")
        print("Response:\n", resp)
    except Exception as e:
        print("Error during request:", e)

if __name__ == '__main__':
    main()
