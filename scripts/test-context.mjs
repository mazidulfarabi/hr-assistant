async function testContext() {
  const messages = [
    { role: "user", content: "who killed john" },
    { role: "assistant", content: "I don't know, please contact HR." },
    { role: "user", content: "who killed shakib" },
    { role: "assistant", content: "I don't know, please contact HR." },
    { role: "user", content: "what if i worked on a holiday" }
  ];

  // We can test this by calling the live API or inspecting
  console.log("Testing with refusal history...");
  // Let's call /api/chat with a combined prompt or check server logic
}
testContext();
