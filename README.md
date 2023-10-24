# Gmail Specific Content Extractor

This script automates the process of logging into your Gmail account to find the most recent unread email from a specified sender, extracts necessary information based on a provided regular expression, and then marks the email as read.

This script is especially useful for scenarios where you need to automate the retrieval of specific information from emails, such as login codes sent by websites for authentication purposes.

### Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js installed.
- Access to the Gmail API through Google Developer Console.

### Setting up your Google Project

1. Go to the [Google Developers Console](https://console.developers.google.com/).
2. Create a new project.
3. Search for and enable the Gmail API.
4. Configure the OAuth consent screen. Add your email as a test user.
5. Create OAuth client ID credentials.
6. Download the client secret file and rename it to `client_secret.json`.

Note: For the redirect URL, you can use `http://localhost`.

The following Gmail API scopes are required for this script (add them in the consent screen configuration):

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.modify`

### Installation

1. Clone this repository to your local machine.
2. Run `npm install` to install the necessary node modules, including `googleapis`.

### Usage

Upon running the script for the first time, you will receive a console prompt with a URL for the Google consent screen. It can be opened from any device. After giving the necessary permissions, you'll be redirected to a `localhost` URL with a code parameter.

Example:
http://localhost/?code=4/0AfJohXnhbIsC2YdVyJ-XDHyBXBmaRRRQn3sKb28r54bRIYM6hcFpbzLxW0IiJBZDsSxq6Q


Copy the code value and paste it back into the console. The script will handle the rest, including token generation and storage.

To use the script in your code, you need to provide the specific sender's email address and a regex pattern to match the content within the email body. Optionally, you can enable console logs.

Example:
```javascript
const extractInfoFromEmail = require('./gmailChecker.js'); // path to the script

async function getInformation() {
  try {
    const content = await extractInfoFromEmail('sender@example.com', 'regex-pattern', 'path-to-client_secret.json', true);
    if (content) {
      console.log('Extracted Content:', content);
    } else {
      console.log('No content matches the provided criteria.');
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

getInformation();```

The script returns false if no content matching the criteria is found.