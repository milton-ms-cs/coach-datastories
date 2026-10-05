# A chatbot that should remember the conversation.
from simple_llm import chat

system_prompt = "You are a friendly study buddy. Keep your answers short."
history = []

print("Type quit to stop.")
while True:
    user_message = input("You: ")
    if user_message == "quit":
        break

    reply = chat(system_prompt, history, user_message)
    print("Bot: " + reply)

    # Remember this turn here.

    print("(history holds " + str(len(history)) + " messages)")
