import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# Together AI API key
API_KEY = "09049a6d636459450583a07aef71ce427f69a6e72fc83b1e9bd81da428292ba1"
API_URL = "https://api.together.xyz/v1/chat/completions"

@csrf_exempt
def chat_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            message = data.get("message")

            if not message:
                return JsonResponse({"error": "Message is required"}, status=400)

           
            headers = {
                "Authorization": f"Bearer 09049a6d636459450583a07aef71ce427f69a6e72fc83b1e9bd81da428292ba1",
                "Content-Type": "application/json",
            }

            payload = {
                "model": "mistral-7b-instruct",
                "messages": [{"role": "user", "content": message}],
            }

            response = requests.post(API_URL, headers=headers, json=payload)
            ai_response = response.json()

        
            if "choices" not in ai_response:
                return JsonResponse({"error": "Invalid API response", "details": ai_response}, status=500)

            response_text = ai_response["choices"][0]["message"]["content"]
            return JsonResponse({"response": response_text})

        except json.JSONDecodeError as e:
            return JsonResponse({"error": e}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)
