import React, { useState } from "react";
import Loadinglogo from '../sp.svg';

const templates = [
  {
    title: "Project Status Update to Management",
    subject: "[Project Name] – Weekly Status Update",
    body: `Hi [Manager’s Name],
I wanted to provide you with an update on the progress of [Project Name] for this week. The team has successfully completed the initial development phase, and we are currently in the process of conducting user acceptance testing. So far, we have identified a few minor issues, which are being addressed by the development team.
Key accomplishments this week:
• Completed integration with the CRM system
• Finalized user documentation drafts
• Resolved 80% of the reported bugs
Next steps:
• Complete final round of testing by Friday
• Prepare for stakeholder demo scheduled for next Wednesday
Please let me know if you have any questions or require additional details.
Best regards,
[Your Name]
[Your Position]`
  },
  {
    title: "Meeting Request with Agenda",
    subject: "Request to Schedule Strategy Meeting – Q3 Planning",
    body: `Hi [Recipient Name],
I hope you are doing well. As we approach the end of Q2, I would like to schedule a strategy meeting to discuss our objectives and action plans for Q3. The meeting will cover the following agenda items:
1. Review of Q2 performance metrics
2. Identification of key opportunities and challenges for Q3
3. Resource allocation and project prioritization
4. Open discussion and feedback
Could you please let me know your availability next week? I will coordinate with the rest of the team to finalize the meeting time.
Looking forward to your response.
Best regards,
[Your Name]
[Your Position]`
  },
  {
    title: "Thank You After a Successful Presentation",
    subject: "Thank You for Your Participation in Today’s Presentation",
    body: `Hi [Recipient Name],
I wanted to extend my sincere thanks for your active participation in today’s presentation on [topic/project]. Your insights and questions greatly contributed to a productive discussion.
If you have any further feedback or would like additional information on any of the topics covered, please do not hesitate to reach out. I have attached the presentation slides and supporting documents for your reference.
Looking forward to our continued collaboration.
Best regards,
[Your Name]
[Your Position]`
  },
  {
    title: "Apology for Missed Deadline",
    subject: "Apology for Delay in Delivering [Project/Task]",
    body: `Hi [Recipient Name],
I am writing to apologize for not meeting the deadline for [project/task] that was due on [date]. Unfortunately, we encountered some unforeseen challenges related to [briefly explain the reason, e.g., resource constraints, technical issues], which caused the delay.
We are actively working to resolve these issues and expect to deliver the completed work by [new deadline]. I understand the importance of timely delivery and assure you that we are taking steps to prevent similar delays in the future.
Thank you for your understanding and patience.
Best regards,
[Your Name]
[Your Position]`
  },
  {
    title: "Follow-Up After a Client Meeting",
    subject: "Follow-Up: [Client Name] Meeting on [Date]",
    body: `Dear [Client Name],
Thank you for taking the time to meet with us on [date]. I appreciate the opportunity to discuss your needs and how our solutions can support your business objectives. As discussed, I have attached the proposal outlining our recommended approach and pricing details.
Please review the attached documents at your convenience. If you have any questions or would like to discuss specific points further, I am available for a call or meeting at your earliest convenience.
Looking forward to your feedback.
Best regards,
[Your Name]
[Your Position]
[Your Company]`
  }
];

function CustomPrompt({ onGenerate, onTemplateSelect }) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const [generatedText, setGeneratedText] = useState(""); // Add generatedText state

  const [showTemplates, setShowTemplates] = useState(false);
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


      <button className="ml-2 p-2 bg-yellow-300 hover:bg-yellow-400 rounded" onClick={() => setShowTemplates(!showTemplates)}>
        Templates
      </button>

      {showTemplates && (
        <div className="absolute top-12 left-0 w-72 bg-white shadow-md rounded p-2 z-10">
          {templates.map((template, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {onTemplateSelect(template)
                setShowTemplates(false);
              }}
            >
              {template.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomPrompt;



