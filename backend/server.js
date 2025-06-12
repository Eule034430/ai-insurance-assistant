const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up the Gemini client once, using our API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Tina’s first words when a user lands on the chat
const initial =
  "I'm Tina. I help you choose the right insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?";

app.post("/insurance", async (req, res) => {
  // Destructure with sensible defaults if the client didn’t send them
  const { userResponse = "", chatHistory = [] } = req.body;

  // If this is the very first call (no user input, no history), send our opener
  if (userResponse.trim() === "" && chatHistory.length === 0) {
    return res.json({ response: initial });
  }

  // Otherwise, stitch the past conversation into a single prompt
  const formattedHistory = chatHistory
    .map((entry) => `${entry.role}: ${entry.message}`)
    .join("\n");

  // Build the message we’ll send to Gemini
  const prompt = `You are Tina, an insurance consultant who will help the user choose the best insurance policy based on their needs.
  You will ask the user up to 4 questions one at a time (don’t hardcode a list). Ask about things like vehicle type, age, racing car or not, truck or not.
  Then pick the best policy from:
  - Mechanical Breakdown Insurance (MBI): not for trucks or racing cars.
  - Comprehensive Car Insurance: only for vehicles under 10 years old.
  - Third Party Car Insurance: available for all.

  Here’s the conversation so far:
  ${formattedHistory}
  You: ${userResponse}
  `;

  try {
    // Fire off our prompt to Gemini
    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    // Send Tina’s reply back to the client
    res.json({ response: reply });
  } catch (error) {
    console.error("Gemini error:", error);
    // If something goes wrong, let the user know in plain English
    res.status(500).json({
      response:
        "Sorry, there was an error while fetching your recommendation. Try again in a moment, please.",
    });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
