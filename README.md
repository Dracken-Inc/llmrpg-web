# LLMRPG Web Project

## Overview
LLMRPG is a web-based role-playing game management tool that allows players and game masters to manage campaigns, characters, and game sessions in real-time. The application features a user-friendly interface built with React for the client-side and an Express server with Socket.IO for real-time communication.

## Project Structure
The project is organized into two main directories: `client` and `server`.

### Client
- **public/index.html**: The main HTML document for the client-side application.
- **src/index.jsx**: The entry point for the React application.
- **src/App.jsx**: The main application component that organizes various panels.
- **src/components/**: Contains individual components for different functionalities:
  - ChatPanel
  - InitiativePanel
  - EncounterPanel
  - CharacterSheet
  - InventoryPanel
  - SpellbookPanel
  - EffectsPanel
- **src/index.css**: CSS styles for the application.
- **src/assets/logo.png**: Logo image for the application.

### Server
- **index.js**: The entry point for the server-side application, setting up the Express server and Socket.IO.
- **managers/**: Contains modules for managing different aspects of the application, such as campaigns and characters.
- **db/campaigns.json**: A JSON file that holds campaign data.

## Getting Started

### Prerequisites
- Node.js and npm installed on your machine.

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd llmrpg-web-project
   ```

2. Install dependencies for the client:
   ```
   cd client
   npm install
   ```

3. Install dependencies for the server:
   ```
   cd ../server
   npm install
   ```

### Running the Application
1. Start the server:
   ```
   cd server
   node index.js
   ```

2. Start the client:
   ```
   cd ../client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to access the application.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.