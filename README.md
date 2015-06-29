# node-irc-tracker
Node.js powered IRC tracker, streaming in real time to a web page.

## Joining the Node.js bandwagon
This is my first ever Node.js experiment, and like all things new, I'm sure it's going to be a lot harder than I imagine. As this is a learning project, I've opened it with a GNU Public License so others may improve on the code, either to show me how it should be done, or to improve it for their own personal use.

## What It Is
An app that streams real-time IRC channel activity to a web page. This means creating a listener bot that idles in the channel, and pushes events via sockets to the browser.

### Activity I want to display:
* Current users and Op status
* Standard chat events, eg:
..* Messages
..* Joins/Parts/Kicks/Bans etc
..* Nick/Topic changes
* Stats based on the above
* Link preview
..* List of Website URLs and titles
..* Media gallery where appropriate
