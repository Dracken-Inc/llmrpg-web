# LLMRPG Web Project Reference

## Overview
This project is a web-based role-playing game (RPG) application that utilizes React for the client-side and Node.js with Express for the server-side. It features real-time communication using Socket.IO and is structured to manage campaigns, characters, and various game elements.

## Project Structure
The project is organized into two main directories: `client` and `server`.

### Client
- **public/index.html**: The main HTML document for the client-side application.
- **src/index.jsx**: The entry point for the React application.
- **src/App.jsx**: The main application component that organizes various panels.
- **src/components/**: Contains individual components for different functionalities:
  - **ChatPanel.jsx**: Displays the chat area.
  - **InitiativePanel.jsx**: Manages initiative tracking.
  - **EncounterPanel.jsx**: Handles encounter management.
  - **CharacterSheet.jsx**: Displays character information.
  - **InventoryPanel.jsx**: Manages character inventory.
  - **SpellbookPanel.jsx**: Displays spells available to characters.
  - **EffectsPanel.jsx**: Manages active effects on characters.
- **src/index.css**: Contains the CSS styles for the application.
- **src/assets/logo.png**: Placeholder for the application logo.

### Server
- **index.js**: The entry point for the server-side application, setting up the Express server and Socket.IO.
- **managers/**: Contains modules for managing different aspects of the application:
  - **campaignManager.js**: Manages campaign data.
  - **characterManager.js**: Manages character data.
  - **[otherManagers].js**: Placeholder for additional managers.
- **db/campaigns.json**: JSON file that holds campaign data (currently empty).

## How to Use
1. **Setup**: Clone the repository and navigate to the project directory.
2. **Install Dependencies**: Run `npm install` in both the `client` and `server` directories to install necessary packages.
3. **Run the Server**: Start the server by running `node index.js` in the `server` directory.
4. **Run the Client**: Start the client application using `npm start` in the `client` directory.
5. **Access the Application**: Open your browser and navigate to `http://localhost:3000` to access the application.

## Tips
- Keep this file in your project root for easy access to project structure and usage instructions.
- Expand the application by adding more components, managers, and logic as needed.