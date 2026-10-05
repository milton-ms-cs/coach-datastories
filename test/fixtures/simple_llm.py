import os
import openai

# --------------------------------------------------
# Codio Bricks–compatible OpenAI client
# --------------------------------------------------

client = openai.OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL")
)

# Locked model choice:
# - Supported by Codio Bricks
# - Modern enough for good behavior
# - Cheap enough for classroom scale
MODEL_NAME = "gpt-4.1-mini"


def ask_once(system_prompt, user_message):
    """
    Ask the model a single question.
    No memory. No conversation history.
    Returns one response as a string.
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages
    )

    return response.choices[0].message.content.strip()


def chat(system_prompt, history, user_message):
    """
    Ask the model a question using conversation history.

    - system_prompt: string (student-written)
    - history: list of {role, content} dictionaries
    - user_message: string

    This function does NOT modify history.
    """
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages
    )

    return response.choices[0].message.content.strip()
