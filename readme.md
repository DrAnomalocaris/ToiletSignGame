Toilet Sign Game
The Toilet Sign Game is an interactive web-based game designed to study bathroom sign preferences. Players first select their preferred bathroom icon (male or female) and then answer a series of questions by choosing between two sign images. The game records responses along with additional data (e.g., IP, country, and a persistent user ID) and sends them to a Google Sheet for further analysis.

Features
Persistent User ID:
Each player is assigned a unique identifier stored in local storage so that duplicate submissions from the same browser can be filtered out.

IP and Country Detection:
The game retrieves the player's IP address and country using the ipapi.co API.

CSV Data Processing:
Results are fetched from a public Google Spreadsheet (CSV format) and processed to compute normalized majority answers per question for both genders. A Punnett square summary is generated for each question to visualize the number of votes for each option.

Game Mechanics:

Players select their preferred gender icon (male/female).
For each question, two images (representing Option A and Option B) are displayed in randomized order.
Once a player selects an option, the game records the side (left/right), disables further changes, and shows the Punnett square summary for that question.
The game continues until all questions are answered.
Additionally, the game includes logic to determine whether a player's choice aligns with the majority for their gender, and it logs whether the answer was correct or not.
Reference Page:
A reference page is available that displays a table for each question (10 questions total), with each row showing small icons for Option A and Option B. This page serves as a quick visual reference of the sign images used in the game.

Data & Source Code
GitHub:
Visit my GitHub for more projects and the source code.

Raw Data:
Download the raw data from the Google Spreadsheet.

Reference Page:
For a visual reference of the sign images for each question, visit the reference page that displays a table with the sign images for Option A and Option B.

How It Works
User Flow:

The player selects a preferred bathroom icon on the initial screen.
The game then displays a series of questions. For each question, two sign images are randomly ordered.
Once the player selects an answer, the game:
Disables further changes.
Sends the result (including IP, country, persistent user ID, and side information) to a Google Apps Script endpoint.
Displays a Punnett square summarizing votes for Option A and Option B.
A "Next" button is provided to advance to the subsequent question.
Data Processing:

The game fetches previous results from the Google Spreadsheet (CSV format).
It computes normalized majority answers for each question by comparing the ratio of votes for each option among male and female respondents.
If both genders show the same majority, tie-breaking rules are applied.
Visual Summary:

After answering each question, the player sees a Punnett square summary which shows the count of votes (displayed with small icons) for each option.
This summary allows you to analyze potential side biases (left/right) and overall preferences.
Technologies Used
Frontend: HTML, CSS, JavaScript
Backend: Google Apps Script (for data submission and spreadsheet integration)
APIs: ipapi.co for IP and country information
License
This project is open source. Feel free to modify and improve the code!