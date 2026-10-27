# Original technical test assignment

**Assignment:**

Imagine we have an educational robot that helps students learn robotics. The robot has a manual containing basic information about sensors, motors, batteries, safety, and programming. A user asks a question through a web application, and the system should answer based on the content of this manual.

The application should provide the following functionality:

- A simple chat interface on a web page.
- The user should be able to ask questions such as:
  - What is an ultrasonic sensor?
  - How does the robot use motors?
  - What should we be careful about when using the battery?
  - How do we use the robot safely in a classroom?

The application should implement a **RAG (Retrieval-Augmented Generation)** workflow:

- Create a small manual/document containing at least **5–10 paragraphs**.
- Split the text into smaller chunks.
- Generate embeddings for the chunks.
- When a user asks a question, retrieve the most relevant chunks.
- Use an LLM to generate an answer **based only on the retrieved context**.

For the LLM, you may use:

- a small local model (if you're familiar with one),
- the OpenAI or Azure OpenAI API,
- or any other LLM API of your choice.

The generated answer should be displayed in the web interface. It is also desirable to display the retrieved context or source below the answer.

**Additional notes:**

- You are welcome to use AI-assisted development tools such as **OpenAI Codex**, **Claude Code**, or similar coding assistants during development.
- Along with the source code, please include a short explanation of your solution and a simple architecture diagram illustrating how the application is structured.
- Briefly describe the purpose of each major component (e.g., frontend, backend, document processing, embeddings, vector database, retrieval, LLM, etc.) and explain how they work together to produce the final answer.
