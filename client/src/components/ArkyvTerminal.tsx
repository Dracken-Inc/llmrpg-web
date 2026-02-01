import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Command response from server
 */
interface CommandResponse {
	type: 'system' | 'room' | 'combat' | 'npc';
	text: string;
	meta?: Record<string, unknown>;
}

/**
 * Terminal output line
 */
interface OutputLine {
	id: number;
	type: 'system' | 'room' | 'combat' | 'npc' | 'input';
	text: string;
}

/**
 * ArkyvTerminal - Arkyv-style terminal UI component
 */
export const ArkyvTerminal: React.FC = () => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [output, setOutput] = useState<OutputLine[]>([]);
	const [input, setInput] = useState('');
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [playerName, setPlayerName] = useState('');
	const [isJoined, setIsJoined] = useState(false);

	const outputRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const lineIdCounter = useRef(0);

	// Initialize socket connection
	useEffect(() => {
		const newSocket = io('http://localhost:3001');

		newSocket.on('connect', () => {
			setIsConnected(true);
			addOutput('system', 'Connected to LLMRPG MUD server.');
		});

		newSocket.on('disconnect', () => {
			setIsConnected(false);
			addOutput('system', 'Disconnected from server.');
		});

		newSocket.on('commandResult', (response: CommandResponse) => {
			addOutput(response.type, response.text);
		});

		newSocket.on('roomUpdate', () => {
			// Room changed - could update UI state here
		});

		newSocket.on('combatLog', (response: CommandResponse) => {
			addOutput('combat', response.text);
		});

		newSocket.on('playerJoined', (data: { playerName: string }) => {
			addOutput('system', `${data.playerName} has joined the world.`);
		});

		newSocket.on('playerLeft', (data: { playerName: string }) => {
			addOutput('system', `${data.playerName} has left the world.`);
		});

		setSocket(newSocket);

		return () => {
			newSocket.close();
		};
	}, []);

	// Auto-scroll to bottom
	useEffect(() => {
		if (outputRef.current) {
			outputRef.current.scrollTop = outputRef.current.scrollHeight;
		}
	}, [output]);

	// Focus input on load
	useEffect(() => {
		inputRef.current?.focus();
	}, [isJoined]);

	const addOutput = (type: OutputLine['type'], text: string) => {
		setOutput((prev) => [
			...prev,
			{ id: lineIdCounter.current++, type, text },
		]);
	};

	const handleJoin = () => {
		if (!playerName.trim()) {
			addOutput('system', 'Please enter a name.');
			return;
		}

		if (socket && isConnected) {
			socket.emit('joinSession', { playerName: playerName.trim() });
			setIsJoined(true);
			addOutput('input', `Joining as ${playerName.trim()}...`);
		}
	};

	const handleCommand = (e: React.FormEvent) => {
		e.preventDefault();

		if (!input.trim()) return;

		const command = input.trim();

		// Add to output
		addOutput('input', `> ${command}`);

		// Add to history
		setCommandHistory((prev) => [...prev, command]);
		setHistoryIndex(-1);

		// Send to server
		if (socket && isConnected) {
			socket.emit('playerCommand', { command });
		}

		// Clear input
		setInput('');
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Command history navigation
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (commandHistory.length === 0) return;

			const newIndex =
				historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
			setHistoryIndex(newIndex);
			setInput(commandHistory[newIndex]);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIndex === -1) return;

			const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
			if (newIndex === commandHistory.length - 1) {
				setHistoryIndex(-1);
				setInput('');
			} else {
				setHistoryIndex(newIndex);
				setInput(commandHistory[newIndex]);
			}
		}
	};

	const getLineColor = (type: OutputLine['type']): string => {
		switch (type) {
			case 'system':
				return '#00ff00';
			case 'room':
				return '#ffff00';
			case 'combat':
				return '#ff0000';
			case 'npc':
				return '#00ffff';
			case 'input':
				return '#ffffff';
			default:
				return '#ffffff';
		}
	};

	if (!isJoined) {
		return (
			<div style={styles.container}>
				<div style={styles.joinBox}>
					<h1 style={styles.title}>LLMRPG MUD</h1>
					<p style={styles.subtitle}>Arkyv + GoMud + KoboldCPP</p>
					<div style={styles.inputGroup}>
						<label style={styles.label}>Enter your name:</label>
						<input
							type="text"
							value={playerName}
							onChange={(e) => setPlayerName(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
							style={styles.nameInput}
							autoFocus
							maxLength={20}
						/>
					</div>
					<button onClick={handleJoin} style={styles.joinButton} disabled={!isConnected}>
						{isConnected ? 'Join World' : 'Connecting...'}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div style={styles.container}>
			<div style={styles.terminal}>
				<div style={styles.header}>
					<span>LLMRPG MUD - {playerName}</span>
					<span style={{ color: isConnected ? '#00ff00' : '#ff0000' }}>
						{isConnected ? '● Connected' : '● Disconnected'}
					</span>
				</div>
				<div ref={outputRef} style={styles.output}>
					{output.map((line) => (
						<div
							key={line.id}
							style={{
								...styles.line,
								color: getLineColor(line.type),
							}}
						>
							{line.text}
						</div>
					))}
				</div>
				<form onSubmit={handleCommand} style={styles.inputForm}>
					<span style={styles.prompt}>{'>'}</span>
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						style={styles.input}
						autoFocus
						disabled={!isConnected}
					/>
				</form>
			</div>
		</div>
	);
};

const styles: Record<string, React.CSSProperties> = {
	container: {
		width: '100vw',
		height: '100vh',
		backgroundColor: '#000000',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		fontFamily: "'Courier New', monospace",
		color: '#ffffff',
	},
	terminal: {
		width: '90%',
		maxWidth: '1200px',
		height: '90%',
		border: '2px solid #00ff00',
		backgroundColor: '#000000',
		display: 'flex',
		flexDirection: 'column',
	},
	header: {
		padding: '8px 16px',
		borderBottom: '1px solid #00ff00',
		display: 'flex',
		justifyContent: 'space-between',
		backgroundColor: '#001100',
	},
	output: {
		flex: 1,
		overflowY: 'auto',
		padding: '16px',
		whiteSpace: 'pre-wrap',
		wordWrap: 'break-word',
	},
	line: {
		marginBottom: '4px',
	},
	inputForm: {
		display: 'flex',
		padding: '8px 16px',
		borderTop: '1px solid #00ff00',
		backgroundColor: '#001100',
	},
	prompt: {
		marginRight: '8px',
		color: '#00ff00',
	},
	input: {
		flex: 1,
		backgroundColor: 'transparent',
		border: 'none',
		outline: 'none',
		color: '#ffffff',
		fontFamily: "'Courier New', monospace",
		fontSize: '14px',
	},
	joinBox: {
		textAlign: 'center',
		padding: '40px',
		border: '2px solid #00ff00',
		backgroundColor: '#001100',
		borderRadius: '8px',
	},
	title: {
		fontSize: '48px',
		marginBottom: '16px',
		color: '#00ff00',
	},
	subtitle: {
		fontSize: '18px',
		marginBottom: '32px',
		color: '#888888',
	},
	inputGroup: {
		marginBottom: '24px',
	},
	label: {
		display: 'block',
		marginBottom: '8px',
		color: '#00ff00',
	},
	nameInput: {
		padding: '8px 16px',
		fontSize: '16px',
		backgroundColor: '#000000',
		border: '1px solid #00ff00',
		color: '#ffffff',
		fontFamily: "'Courier New', monospace",
		width: '300px',
	},
	joinButton: {
		padding: '12px 32px',
		fontSize: '18px',
		backgroundColor: '#00ff00',
		border: 'none',
		color: '#000000',
		cursor: 'pointer',
		fontFamily: "'Courier New', monospace",
		fontWeight: 'bold',
	},
};
