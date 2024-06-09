angular.module('OverflowCreate', [])
.controller('MainController', function($scope,$filter) {
    $scope.sessions = [];
    $scope.isEditing = false;
    $scope.newSession = {};
    $scope.dragIndex = null;
    $scope.lines = [];
    $scope.doubleClickedBlockIndex = null; // Track the index of the double-clicked block

    // Define draggable blocks
    $scope.blocks = [
        {label: 'Home', color: '#ff9999', title: 'Math', time: '', description: '', isEdited: false},
        {label: 'School', color: '#99ff99', title: 'Science', time: '', description: '', isEdited: false},
        {label: 'Hobbies', color: '#9999ff', title: 'History', time: '', description: '', isEdited: false},
        {label: 'Events', color: '#ffcc99', title: 'Language', time: '', description: '', isEdited: false}
    ];

    // Define time options
    $scope.timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minutes = 0; minutes < 60; minutes += 30) {
            const hourStr = hour < 10 ? '0' + hour : hour;
            const minutesStr = minutes < 10 ? '0' + minutes : minutes;
            $scope.timeOptions.push(`${hourStr}:${minutesStr}`);
        }
    }

    // Handle block drag start
    $scope.startDrag = function(event, index) {
        $scope.dragIndex = index;
    };

    // Handle double-click on a block
    $scope.doubleClickBlock = function(index) {
        $scope.blocks.forEach(block => block.isEdited = false); // Reset all blocks
        $scope.blocks[index].isEdited = true; // Mark the double-clicked block
        $scope.doubleClickedBlockIndex = index; // Store the

    };

    // Handle drop event
    $scope.onDropComplete = function(event) {
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        if ($scope.dragIndex >= 0 && $scope.dragIndex < $scope.blocks.length) { // Ensure dragIndex is within bounds
            const block = $scope.blocks[$scope.dragIndex];
            const newSession = angular.copy(block);

            // Find the position for the new block
            let newX = x;
            let newY = y;
            const offset = 50; // Increase the offset for spacing

            // Check for available space
            let spaceAvailable = false;
            while (!spaceAvailable) {
                spaceAvailable = true;
                for (let i = 0; i < $scope.sessions.length; i++) {
                    const session = $scope.sessions[i];
                    if (Math.abs(session.position.left - newX) < offset && Math.abs(session.position.top - newY) < offset) {
                        newX += offset; // Move the new block to the right
                        newY += offset; // Move the new block down
                        spaceAvailable = false;
                        break;
                    }
                }
            }

            newSession.position = {left: newX, top: newY};
            $scope.sessions.push(newSession);
            $scope.dragIndex = null;
            $scope.$apply();
            updateLines();
        } else {
            console.error("Invalid dragIndex or block is undefined");
        }
    };

    // Remove session from canvas
    $scope.removeSession = function(session) {
        const index = $scope.sessions.indexOf(session);
        $scope.sessions.splice(index, 1);
        updateLines();
    };

    // Double click handler for blocks
    $scope.expandBlock = function(event, block) {
        if ($scope.doubleClickedBlockIndex === null) {
            $scope.doubleClickedBlockIndex = $scope.blocks.findIndex(b => b.title === block.title);
        } else {
            $scope.doubleClickedBlockIndex = null;
        }
    };

    // Edit session on canvas
    $scope.editSession = function(session) {
        session.isEditing = !session.isEditing;
        if (!session.isEditing) {
            updateLines();
            $scope.doubleClickedBlockIndex = null;
        }
    };

    // Delete session from canvas
    $scope.deleteSession = function(session) {
        const index = $scope.sessions.indexOf(session);
        if (index !== -1) {
            $scope.sessions.splice(index, 1);
            updateLines(); // Update lines after deleting the session
        }
    };


    // Update lines between sessions
    function updateLines() {
        $scope.lines.forEach(line => line.remove());
        $scope.lines = [];
        for (let i = 0; i < $scope.sessions.length - 1; i++) {
            const startElement = document.getElementById(`session-${i}`);
            const endElement = document.getElementById(`session-${i + 1}`);
            const line = new LeaderLine(startElement, endElement, {color: 'black', size: 2});
            $scope.lines.push(line);
        }
    }

    interact('.block').draggable({
        autoScroll: true,
        listeners: {
            start: function(event) {
                event.target.style.transform = 'scale(1.1)'; // Scale up when dragging starts
            },
            end: function(event) {
                event.target.style.transform = 'scale(1)'; // Scale down when dragging ends
            }
        }
    });

    interact('.session').draggable({
        listeners: {
            move: function(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
                updateLines(); // Update lines on move
            }
        }
    });

    interact('.canvas').dropzone({
        accept: '.block',
        ondrop: $scope.onDropComplete
    });
    $scope.generateKey = function() {
        let key = '';
        for (let i = 0; i < $scope.sessions.length; i++) {
            const session = $scope.sessions[i];
            const dateFormatted = $filter('date')(session.date, 'MM/dd/yyyy');
            key += `${session.label}@${dateFormatted}.${session.time},`;
        }
        // Remove the trailing comma
        key = key.slice(0, -1);
        return key;
    };
    $scope.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(function() {
            console.log('Key copied to clipboard');
        }, function(err) {
            console.error('Failed to copy key to clipboard: ', err);
        });
    };

});


