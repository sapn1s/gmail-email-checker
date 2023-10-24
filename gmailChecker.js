const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline')

//const open = require('open');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'];

const TOKEN_PATH = 'token.json';
const CLIENT_SECRET_FILE = 'client_secret.json'

async function authorize(clientSecretPath) {
  try {
    const credentials = JSON.parse(fs.readFileSync(clientSecretPath, 'utf-8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);

    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    } else {
      return getNewToken(oAuth2Client);
    }
  } catch (error) {
    throw new Error('Authorization error:', error);
  }

}

async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('Error while trying to retrieve access token', err);
          return reject(err);
        }
        oAuth2Client.setCredentials(token);

        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to', TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

async function checkEmails(auth, sender_header, email_body_regex, logs) {
  const gmail = google.gmail({ version: 'v1', auth });
  const query = 'is:unread';

  try {
    const res = await gmail.users.messages.list({ userId: 'me', q: query });
    const messages = res.data.messages;

    if (!messages) {
      if(logs) console.log('No new messages.');
      return false;
    } else {
      if(logs) console.log(`You have ${messages.length} new message(s):`);
      for (const message of messages) {

        const msg = await gmail.users.messages.get({ userId: 'me', id: message.id });
        const fromHeader = await msg.data.payload.headers.find(header => header.name.toLowerCase() === 'from');
        if (fromHeader && fromHeader.value === sender_header) {
          // Assuming the message body is in 'data' and is base64 encoded.
          const bodyData = msg.data.payload.body.data;
          const emailBody = Buffer.from(bodyData, 'base64').toString('utf8');
          // Assuming we are looking for a content in the email body.
          const regexString = email_body_regex;
          const myRegex = new RegExp(regexString);
          const matches = emailBody.match(myRegex);
          let content;
          if (matches) {
            content = matches[1];
          } else {
            if(logs) console.log("Content not found in the email body.")
            return false
          }

          // Mark the message as read
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            requestBody: {
              removeLabelIds: ['UNREAD'],
            },
          });

          if(logs) console.log("Found content:", content);
          return content;
        } else {
          if(logs) console.log("No messages from the specified sender");
          return false;
        }
      }
    }
  } catch (error) {
    throw new Error('The API returned an error:', error.message);

  }
}

module.exports = async function (sender_header, email_body_regex, clientSecretPath = CLIENT_SECRET_FILE, logs = false) {
  if (!sender_header || !email_body_regex) {
    throw new Error('Invalid input: Sender header and Email body regex are required');
  }

  const auth = await authorize(clientSecretPath);
  return await checkEmails(auth, sender_header, email_body_regex, logs);
}