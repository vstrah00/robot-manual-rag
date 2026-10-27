"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import {
  MAX_QUESTION_LENGTH,
  type ChatResponse,
  type ManualSection,
  type RetrievedSource,
  type AnswerStatus,
} from "@/lib/types";

const examples = [
  { topic: "SENSORS", question: "What is an ultrasonic sensor?", mark: "01" },
  { topic: "MOVEMENT", question: "How does the robot use motors?", mark: "02" },
  {
    topic: "BATTERY",
    question: "What should we be careful about when using the battery?",
    mark: "03",
  },
  {
    topic: "SAFETY",
    question: "How do we use the robot safely in a classroom?",
    mark: "04",
  },
];

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: RetrievedSource[];
  model?: string;
  embeddingModel?: string;
  sourceIds?: string[];
  status?: AnswerStatus;
};

function revealExpandedSection(event: MouseEvent<HTMLElement>) {
  const heading = event.currentTarget;
  const section = heading.closest("details");
  // Wait for the summary's native mouse/keyboard action to open the details.
  // Handling user activation avoids scrolling initially open answer sources.
  requestAnimationFrame(() => {
    if (!section?.open) return;
    const area = section.closest<HTMLElement>("[data-scroll-area]");
    if (!area) return;
    const top = Math.max(
      0,
      area.scrollTop + heading.getBoundingClientRect().top -
        area.getBoundingClientRect().top - 8,
    );
    // Allow even the last, short section to align at the top of the reader.
    const previousSpace = Number.parseFloat(
      area.style.getPropertyValue("--expansion-space"),
    ) || 0;
    const naturalEnd = area.scrollHeight - area.clientHeight - previousSpace;
    area.style.setProperty("--expansion-space", `${Math.max(0, top - naturalEnd)}px`);
    area.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  });
}

function RoverMark({ large = false }: { large?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className={large ? "rover-large" : "rover-mark"}
    >
      <path d="M40 11v10" stroke="currentColor" strokeWidth="3" />
      <circle cx="40" cy="9" r="4" fill="currentColor" />
      <rect
        x="13"
        y="23"
        width="54"
        height="39"
        rx="13"
        stroke="currentColor"
        strokeWidth="3"
      />
      <rect
        x="22"
        y="33"
        width="36"
        height="16"
        rx="6"
        fill="currentColor"
        fillOpacity=".12"
      />
      <circle cx="30" cy="41" r="3" fill="currentColor" />
      <circle cx="50" cy="41" r="3" fill="currentColor" />
      <path
        d="M34 55h12M7 37v13m66-13v13M23 65v6m34-6v6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Chat({ sections }: { sections: ManualSection[] }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inFlight = useRef(false);
  const questionTooLong = question.length > MAX_QUESTION_LENGTH;

  useEffect(() => {
    // Reveal a newly submitted question, then preserve the reader's position
    // when its answer arrives or the loading indicator changes.
    const latest = messages.at(-1);
    if (latest?.role === "user") {
      conversationRef.current
        ?.querySelector(`[data-message-id="${latest.id}"]`)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [messages]);

  async function sendQuestion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || text.length > MAX_QUESTION_LENGTH || inFlight.current) return;
    conversationRef.current?.style.removeProperty("--expansion-space");
    inFlight.current = true;
    setPending(true);
    setError(null);
    setQuestion("");
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
        signal: AbortSignal.timeout(50_000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Something went wrong. Please try again.",
        );
      const result = data as ChatResponse;
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.answer,
          sources: result.sources,
          model: result.model,
          embeddingModel: result.embeddingModel,
          sourceIds: result.sourceIds,
          status: result.status,
        },
      ]);
    } catch (cause) {
      const timeout =
        cause instanceof Error &&
        (cause.name === "TimeoutError" || cause.name === "AbortError");
      setError(
        timeout
          ? "The server took too long. Please try again."
          : cause instanceof Error
            ? cause.message
            : "Could not reach the server. Please try again.",
      );
      setQuestion(trimmed);
    } finally {
      inFlight.current = false;
      setPending(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Classroom Rover home">
          <span className="brand-icon">
            <RoverMark />
          </span>
          <span>
            classroom<span className="brand-light">rover</span>
            <small>THE ROBOT MANUAL</small>
          </span>
        </a>
        <div className="sidebar-body">
          <div className="sidebar-eyebrow">YOUR WORKSPACE</div>
          <div className="active-nav">
            <span aria-hidden="true">↗</span> Manual chat{" "}
            <span className="nav-dot" />
          </div>
          <div className="manual-heading">
            <span>REFERENCE DOCUMENT</span>
            <span>{String(sections.length).padStart(2, "0")}</span>
          </div>
          <button
            className="manual-toggle"
            onClick={() => setManualOpen(!manualOpen)}
            aria-expanded={manualOpen}
            aria-controls="manual-sections"
          >
            {manualOpen ? "Hide manual" : "Read the manual"}
            <span aria-hidden="true">{manualOpen ? "−" : "+"}</span>
          </button>
          <p className={`manual-scroll-hint ${manualOpen ? "is-open" : ""}`}>
            Scroll to explore all {sections.length} sections
            <span aria-hidden="true">↓</span>
          </p>
          <div
            id="manual-sections"
            data-scroll-area
            className={`manual-sections ${manualOpen ? "is-open" : ""}`}
            role="region"
            aria-label="Robot manual sections"
            tabIndex={0}
          >
            {sections.map((section, index) => (
              <details key={section.id} className="manual-section">
                <summary onClick={revealExpandedSection}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </summary>
                <p>{section.text}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="document-note">
          <span className="document-label">CLASSROOM ROVER</span>
          <strong>
            A little robot.
            <br />A lot to discover.
          </strong>
          <p>10 sections on sensors, movement, power, and safe exploration.</p>
          <span className="document-foot">
            Fictional manual · Learning project
          </span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <span>
            Workspace <span className="breadcrumb-divider">/</span>{" "}
            <strong>Manual chat</strong>
          </span>
          <span className="status">
            <span />
            Answers from the manual
          </span>
        </header>
        <div className="chat-workspace">
          <div className="chat-topline">
            <span className="eyebrow">MEET YOUR CLASSROOM COMPANION</span>
            <button
              className="text-button"
              disabled={pending || !messages.length}
              onClick={() => {
                conversationRef.current?.style.removeProperty("--expansion-space");
                setMessages([]);
                setError(null);
                setQuestion("");
              }}
            >
              New chat <span aria-hidden="true">↺</span>
            </button>
          </div>

          <div className="conversation" ref={conversationRef} data-scroll-area>
            {!messages.length ? (
              <div className="welcome">
                <div className="welcome-art">
                  <span className="orbit-dot dot-one" />
                  <span className="orbit-dot dot-two" />
                  <RoverMark large />
                  <span className="art-label">HELLO, EXPLORER.</span>
                </div>
                <h1>
                  Small robot.
                  <br />
                  <span>Big questions.</span>
                </h1>
                <p className="welcome-copy">
                  Explore the Classroom Rover manual.
                  <br />
                  Start with a question about how your robot works.
                </p>
                <div className="example-grid">
                  {examples.map((example) => (
                    <button
                      key={example.mark}
                      className="example-card"
                      onClick={() => void sendQuestion(example.question)}
                      disabled={pending}
                    >
                      <span className="example-top">
                        <span>{example.topic}</span>
                        <span>{example.mark}</span>
                      </span>
                      <span className="example-question">
                        {example.question}
                      </span>
                      <span className="example-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="message-list"
                role="log"
                aria-label="Chat messages"
                aria-live="polite"
                aria-relevant="additions"
              >
                {messages.map((message) => (
                  <article
                    key={message.id}
                    data-message-id={message.id}
                    className={`message ${message.role}`}
                  >
                    <div className="message-avatar">
                      {message.role === "assistant" ? <RoverMark /> : "YOU"}
                    </div>
                    <div className="message-content">
                      <div className="message-label">
                        {message.role === "user" ? "You" : "Classroom Rover"}
                        {message.role === "assistant" && (
                          <span className="setup-label">
                            {message.status === "not_in_manual"
                              ? "NOT IN THE MANUAL"
                              : message.status === "partial"
                                ? "PARTIAL ANSWER"
                                : "MANUAL ANSWER"}
                          </span>
                        )}
                      </div>
                      <p>{message.text}</p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="retrieved-sources">
                          <div className="sources-heading">
                            RETRIEVED CONTEXT
                          </div>
                          {message.sources.map((source, index) => (
                            <details
                              className="retrieved-source"
                              key={source.id}
                              open={index === 0}
                            >
                              <summary onClick={revealExpandedSection}>
                                <span className="source-title">
                                  {index + 1}. {source.title}
                                  {message.sourceIds?.includes(source.id) && (
                                    <span className="source-cited">Cited</span>
                                  )}
                                </span>
                                <span className="source-score">
                                  Similarity {source.score.toFixed(3)}
                                </span>
                              </summary>
                              <p>{source.text}</p>
                              <span className="source-reference">
                                manual.md · {source.id}
                                {message.sourceIds?.includes(source.id)
                                  ? " · Cited in answer"
                                  : " · Retrieved, not cited"}
                              </span>
                            </details>
                          ))}
                          <p className="similarity-note">
                            Higher scores mean closer embedding similarity, not
                            confidence that the text answers the question.
                            Search returns the closest sections even when the
                            manual has no answer.
                          </p>
                          <span className="embedding-model">
                            Answer: {message.model} · Embeddings:{" "}
                            {message.embeddingModel}
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {pending && (
                  <div className="pending-message" role="status">
                    <span className="loading-dot" />
                    Searching the manual and preparing an answer…
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="composer-area">
            <div className="setup-notice">
              <span className="notice-symbol" aria-hidden="true">
                i
              </span>
              <p>
                <strong>Answers from the manual.</strong> Check the source
                excerpts below each answer. If information is missing, the
                assistant should say so.
              </p>
            </div>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <form
              className="composer"
              onSubmit={submit}
              aria-label="Ask about the manual"
            >
              <label htmlFor="question" className="sr-only">
                Your question about the robot manual
              </label>
              <textarea
                ref={inputRef}
                id="question"
                rows={2}
                value={question}
                aria-invalid={questionTooLong}
                aria-describedby={
                  questionTooLong ? "question-count question-limit" : "question-count"
                }
                onChange={(event) => setQuestion(event.target.value)}
                disabled={pending}
                placeholder="Ask a question about your robot…"
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <p id="question-limit" className="question-limit" role="status">
                {questionTooLong
                  ? `Please shorten your question to ${MAX_QUESTION_LENGTH} characters or fewer.`
                  : ""}
              </p>
              <div className="composer-bottom">
                <span>
                  CLASSROOM ROVER MANUAL
                  <span className="composer-shortcut"> · Enter to send</span>
                </span>
                <div className="composer-actions">
                  <span
                    id="question-count"
                    className={`question-count${questionTooLong ? " over-limit" : ""}`}
                  >
                    {question.length}/{MAX_QUESTION_LENGTH}
                  </span>
                  <button
                    className="send-button"
                    type="submit"
                    disabled={pending || !question.trim() || questionTooLong}
                    aria-label="Send question"
                  >
                    {pending ? (
                      <span className="button-spinner" />
                    ) : (
                      <span aria-hidden="true">↑</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
            <p className="footer-note">
              Built to learn. Grounded in the manual.{" "}
              <span>Classroom Rover · Manual chat</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
