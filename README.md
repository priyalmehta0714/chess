Chess Game Backend
A high-performance Node.js backend for a real-time Chess application. This service handles game state synchronization, move validation, and concurrent player sessions using WebSockets.

🚀 Features
Real-time Gameplay: Integrated with Socket.io for instantaneous move broadcasting.

Room Management: Supports multiple concurrent game rooms with unique IDs.

Move Validation: Server-side logic to ensure all moves follow standard Chess rules.

Game State Persistence: Tracks the board state (FEN) to handle player reconnections.

Event-Driven Architecture: Lightweight and scalable backend structure.

🛠 Tech Stack
Runtime: Node.js

Framework: Express.js

WebSockets: Socket.io

Logic: JavaScript

📦 Installation & Setup
1. Clone the repository:
git clone https://github.com/priyalmehta0714/chess.git

2. Install dependencies:
npm install

3. Start the server:
npm start

📡 Socket Events
connection: Handshake for new players.

joinGame: Assigns a player to a specific game room.

move: Validates and broadcasts chess moves.

gameOver: Triggered on Checkmate, Stalemate, or Resignation.
