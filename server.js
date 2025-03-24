const { Server } = require("socket.io");

const io = new Server(8888, {
    cors: {
        origin: "*", // Update this in production
        methods: ["GET", "POST"],
    },
});

console.log('Socket.IO server is running on ws://localhost:8888');

const rooms = {}; // Track rooms and connected players
let pendingList = []; // List of pending players
let groups = []; // List of player groups

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    pendingList.push(socket.id);

    createRoomIfPossible();

    socket.on('disconnect', () => handleDisconnection(socket));

    socket.on('onMove', (data) => handleMove(socket, data));

    socket.on('sendMessage', (data) => handleMessage(socket, data));
});

/**
 * Handles player disconnection
 */
function handleDisconnection(socket) {
    console.log(`User disconnected: ${socket.id}`);
    const group = findGroupByPlayer(socket.id);

    if (group) {
        const opponentId = getOpponentId(group, socket.id);

        notifyOpponentDisconnection(opponentId);

        pendingList.push(opponentId); // Add opponent to pending list

        io.once('playerAction', (data) => handlePlayerAction(data, opponentId));
    }

    removePlayerFromPendingList(socket.id);
    removeGroupContainingPlayer(socket.id);
    logPendingAndGroups();
}

/**
 * Handles player actions like waiting or quitting after opponent disconnection
 */
function handlePlayerAction(data, opponentId) {
    if (data.action === 'wait') {
        matchNewPlayer(opponentId);
    } else if (data.action === 'quit') {
        io.to(opponentId).emit('gameEnded', { message: 'You have quit the game.' });
    }
}

/**
 * Creates rooms if pending players are sufficient
 */
function createRoomIfPossible() {
    if (pendingList.length >= 2) {
        const newGroups = makePairs(pendingList);
        groups = [...groups, ...newGroups];

        newGroups.forEach((group, index) => {
            const roomId = `room_${groups.length + index}`;
            rooms[roomId] = group;

            assignPlayersToRoom(group, roomId);
        });
    } else {
        console.log("Waiting for another player to join...");
    }
}

/**
 * Handles player moves
 */
function handleMove(socket, data) {
    const group = findGroupByPlayer(socket.id);

    if (group) {
        const opponentId = getOpponentId(group, socket.id);
        io.to(opponentId).emit('OnChangeMove', data);
    }
}

/**
 * Handles player messages
 */
function handleMessage(socket, data) {
    const group = findGroupByPlayer(socket.id);

    if (group) {
        const opponentId = getOpponentId(group, socket.id);
        io.to(opponentId).emit('receiveMessage', data);
    }
}

/**
 * Matches a player with a new opponent
 */
function matchNewPlayer(opponentId) {
    if (pendingList.length > 0) {
        const newPlayerId = pendingList.shift();
        const newGroup = createGroup(opponentId, newPlayerId);

        assignPlayersToRoom(newGroup, `room_${groups.length}`);
    } else {
        io.to(opponentId).emit('noNewPlayer', { message: 'No new player available. The game will end.' });
    }
}

/**
 * Finds the group containing a player
 */
function findGroupByPlayer(playerId) {
    return groups.find(group => group.player1 === playerId || group.player2 === playerId);
}

/**
 * Removes a group containing a specific player
 */
function removeGroupContainingPlayer(playerId) {
    groups = groups.filter(group => group.player1 !== playerId && group.player2 !== playerId);
}

/**
 * Removes a player from the pending list
 */
function removePlayerFromPendingList(playerId) {
    pendingList = pendingList.filter(id => id !== playerId);
}

/**
 * Logs the current state of pending players and groups
 */
function logPendingAndGroups() {
    console.log("Updated Pending List:", pendingList);
    console.log("Updated Groups:", groups);
}

/**
 * Sends a notification to the opponent of a disconnected player
 */
function notifyOpponentDisconnection(opponentId) {
    io.to(opponentId).emit('opponentDisconnected', {
        message: 'Your opponent has disconnected. Do you want to wait for a new player or quit the game?',
        action: 'wait_or_quit',
    });
}

/**
 * Assigns players to a room and notifies them
 */
function assignPlayersToRoom(group, roomId) {
    [group.player1, group.player2].forEach((player, index) => {
        io.to(player).emit('roomJoined', index === 0 ? 'White' : 'Black');
        io.to(player).emit('onMove', { data: player });
    });
}

/**
 * Creates a group of two players
 */
function createGroup(player1, player2) {
    const group = { player1, player2 };
    groups.push(group);
    return group;
}

/**
 * Creates pairs of players from the pending list
 */
function makePairs(list) {
    const pairs = [];
    while (list.length >= 2) {
        pairs.push(createGroup(list.shift(), list.shift()));
    }
    return pairs;
}

/**
 * Gets the opponent ID in a group
 */
function getOpponentId(group, playerId) {
    return group.player1 === playerId ? group.player2 : group.player1;
}
