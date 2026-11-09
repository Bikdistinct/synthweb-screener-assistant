from groq import Groq

client = Groq(api_key="")

# Fetch all models accessible by your account
models = client.models.list()

for model in sorted(models.data, key=lambda m: m.id):
    print(f"Model ID: {model.id} (Owner: {model.owned_by})")