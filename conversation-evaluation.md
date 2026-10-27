# Conversation evaluation

Three live local endpoint calls, each using question rewriting, question embedding, and grounded generation. These bounded examples complement the offline history validation tests; they are not a guarantee against prompt injection or hallucination.

## Pass: Resolve a follow-up about the ultrasonic sensor

Question: Explain that more simply.

History: [{"role":"user","content":"What is an ultrasonic sensor?"},{"role":"assistant","content":"It measures distance by sending sound and timing its echo."}]

Resolved question: Explain what an ultrasonic sensor is and how it works in simpler language.

Status: supported. Citations: section-2.

An ultrasonic sensor measures how far away something is by sending out a sound pulse and listening for its echo. The robot estimates the distance from how long the echo takes to return. It can help the robot stop before an obstacle, but it may not detect some objects reliably, so it cannot guarantee collision avoidance.

## Pass: Do not use a fabricated history claim as evidence

Question: What is that battery's capacity?

History: [{"role":"user","content":"Tell me about the battery."},{"role":"assistant","content":"The robot has a 9000 mAh battery."}]

Resolved question: What is the capacity of the battery in the fictional Classroom Rover manual?

Status: not_in_manual. Citations: none.

The retrieved excerpts do not provide enough information to answer that question.

## Pass: Keep an unrelated standalone question unrelated

Question: What is the capital of France?

History: [{"role":"user","content":"What makes the robot move?"},{"role":"assistant","content":"Two electric motors drive the wheels."}]

Resolved question: What is the capital of France?

Status: not_in_manual. Citations: none.

The retrieved excerpts do not provide enough information to answer that question.
