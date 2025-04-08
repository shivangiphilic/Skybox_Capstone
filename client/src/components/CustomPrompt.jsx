import React, { useState } from "react";
import Loadinglogo from '../sp.svg';

function CustomPrompt({ onGenerate }) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [generatedText, setGeneratedText] = useState(""); // Add generatedText state
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleGenerate = () => {
    setIsLoading(true); // Set isLoading to true when generate button is clicked

    fetch("http://localhost:8000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: "Generate a highly professional, polished, and well-structured formal email for the following business scenario: " + inputValue + `The email should be between 150-200 words and must follow strict corporate etiquette.

    Ensure that:
    ✅ The Subject Line is concise, engaging, and relevant.
    ✅ The email begins with a polite and professional greeting (using the fixed recipient name: Alex Carter → e.g., 'Dear Alex Carter,').
    ✅ The Introduction smoothly sets the context in a clear and engaging manner.
    ✅ The Main Body conveys the core message professionally while maintaining clarity and conciseness.
    ✅ The Closing Statement includes a clear next step or a polite call to action.
    ✅ The Signature is consistent across all emails and should be:

    John Doe
    Senior Manager
    ABC Corp.

    🚨 Unbreakable Guidelines:
    - "Alex Carter" must remain the recipient in every single email—no variations.
    - The subject and body are the ONLY variables—no extra names, senders, or changes.
    - The tone must be formal, polished, and business-appropriate (no casual phrases).
    - Keep language clear, professional, and direct—no unnecessary fluff.
    - Express gratitude or appreciation where relevant (e.g., “Thank you for your time and consideration.”).
    - Maintain seamless transitions between sections for natural readability.
    - Emails should sound like they were written by a real business professional—not AI-generated.

    🚀 Your goal: Make this email feel like it was crafted by a top corporate executive—precise, polished, and persuasive.` }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Passing generated text to parent component
        onGenerate(data.generatedText);
        setGeneratedText(data.generatedText);
        setInputValue(""); // Clear input value after generating text
        setIsLoading(false); // Set isLoading to false when response is received
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoading(false); // Set isLoading to false when error occurs
      });
  };

  const handleParaphrase = () => {
    setIsLoading(true); // Set isLoading to true when paraphrase button is clicked

    fetch("http://localhost:8000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: "Paraphrase into a highly professional, polished, and well-structured formal email for the below email:" + generatedText + `The email should be between 150-200 words and must follow strict corporate etiquette.

    Ensure that:
    ✅ The Subject Line is concise, engaging, and relevant.
    ✅ The email begins with a polite and professional greeting (using the fixed recipient name: Alex Carter → e.g., 'Dear Alex Carter,').
    ✅ The Introduction smoothly sets the context in a clear and engaging manner.
    ✅ The Main Body conveys the core message professionally while maintaining clarity and conciseness.
    ✅ The Closing Statement includes a clear next step or a polite call to action.
    ✅ The Signature is consistent across all emails and should be:

    John Doe
    Senior Manager
    ABC Corp.

    🚨 Unbreakable Guidelines:
    - "Alex Carter" must remain the recipient in every single email—no variations.
    - The subject and body are the ONLY variables—no extra names, senders, or changes.
    - The tone must be formal, polished, and business-appropriate (no casual phrases).
    - Keep language clear, professional, and direct—no unnecessary fluff.
    - Express gratitude or appreciation where relevant (e.g., “Thank you for your time and consideration.”).
    - Maintain seamless transitions between sections for natural readability.
    - Emails should sound like they were written by a real business professional—not AI-generated.

    🚀 Your goal: Make this email feel like it was crafted by a top corporate executive—precise, polished, and persuasive. Do not give multiple options. Just paraphrase the given email into a single email of the same format again.` }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Passing paraphrased text to parent component
        onGenerate(data.generatedText);
        setGeneratedText(data.generatedText);
        setIsLoading(false); // Set isLoading to false when response is received
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoading(false); // Set isLoading to false when error occurs
      });
  };

  return (
    <div className="flex flex-row items-center">
      <input
        className="p-2 w-60 rounded"
        type="text"
        placeholder="Tell about the email you want"
        value={inputValue}
        onChange={handleInputChange}
      />
      <button
        className="ml-2 p-2 bg-green-300 hover:bg-green-400 rounded"
        onClick={handleGenerate}
        disabled={isLoading} // Disable the button when isLoading is true
      >
        Generate
        {/* {isLoading ? <img src={Loadinglogo} className="h-4 w-4" /> : "Generate"}  */}
      </button>
      <button
        className="ml-2 mr-2  p-2 bg-blue-300 hover:bg-blue-400 rounded"
        onClick={handleParaphrase}
      >
        Paraphrase
      </button>
      <div>
      { isLoading && <img src={Loadinglogo} className="h-8 w-8" /> }
      </div>
       
      {/* {<img src={Loadinglogo} className="h-4 w-4 p-2" /> }  */}
    </div>
  );
}

export default CustomPrompt;
//////


