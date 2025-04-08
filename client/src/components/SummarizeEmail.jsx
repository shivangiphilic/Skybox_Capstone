import React from 'react'
import Loadinglogo from '../sp.svg';
import { useState } from 'react';

function SummarizeEmail({ email }) {
    const [isLoading, setIsLoading] = useState(false);
    const [summarizedText , setSummarizedText] = useState('');

    const handleGenerate = () => {
        setIsLoading(true); // Set isLoading to true when generate button is clicked
    
        fetch("http://localhost:8000/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: email.body + `Summarize the above formal business email in 3-4 concise, professional sentences that clearly capture the essence of the message.

Ensure the summary:

✅ Maintains a formal and polished tone, consistent with corporate communication.

✅ Clearly outlines the main purpose of the email.

✅ Highlights any key actions, decisions, or next steps.

✅ Is suitable for an executive-level email digest or internal recap.

✅ Does not include the greeting, signature, or subject line—focus only on the core content.

🚨 Unbreakable Guidelines:

Do not quote or copy full sentences from the email—rephrase with brevity and clarity.

Avoid redundant formalities; be succinct but professional.

Assume the reader is a senior executive who needs a quick but complete grasp of the email's intent.

` }),
        })
          .then((response) => response.json())
          .then((data) => {
            // Passing generated text to parent component
            
            setSummarizedText(data.generatedText);
            setIsLoading(false); // Set isLoading to false when response is received
          })
          .catch((error) => {
            console.error("Error:", error);
            setIsLoading(false); // Set isLoading to false when error occurs
          });
      };


    return (
    <div >
        <button
        className="p-2 bg-green-300 hover:bg-green-400 rounded fixed bottom-5 left-72 m-2 w-50 px-2"
        onClick={handleGenerate}
        >
        {isLoading ? <img src={Loadinglogo} className="h-4 w-4" /> : "Summarize the Email"} 
        </button>
        {summarizedText &&
          (
          <div className='border-solid border-2 border-zinc-600 p-4 mr-2 mb-16 text-justify'>
            <h1 className='font-semibold text-lg'>Summarized Email :</h1>
            <p>{summarizedText}</p>
          </div>
          )
        }
    </div>
    )
}

export default SummarizeEmail;
