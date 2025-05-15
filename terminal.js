document.addEventListener('DOMContentLoaded', () => {
    const outputDiv = document.getElementById('output');
    const commandInput = document.getElementById('commandInput');
    const terminalDiv = document.getElementById('terminal');
    const history = [];
    let historyIndex = -1;

    const welcomeMessage = `
Web Terminal Emulator (c) 2025
Type 'help' for a list of available commands.
    `;
    printToOutput(welcomeMessage.trim(), 'info');

    commandInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const commandText = this.value.trim();
            if (commandText) {
                history.push(commandText);
                historyIndex = history.length;
                printToOutput(`user@webterm:~$ ${commandText}`, 'command-echo');
                processCommand(commandText);
            }
            this.value = '';
            scrollToBottom();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (history.length > 0 && historyIndex > 0) {
                historyIndex--;
                this.value = history[historyIndex];
                this.setSelectionRange(this.value.length, this.value.length); // Move cursor to end
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (history.length > 0 && historyIndex < history.length - 1) {
                historyIndex++;
                this.value = history[historyIndex];
                this.setSelectionRange(this.value.length, this.value.length);
            } else if (historyIndex === history.length - 1) {
                historyIndex++;
                this.value = ''; // Clear if at the end of history
            }
        } else if (event.key === 'Tab') {
            event.preventDefault();
            // Basic tab completion (can be expanded)
            const currentInput = this.value.toLowerCase();
            const availableCommands = Object.keys(commands);
            const suggestions = availableCommands.filter(cmd => cmd.startsWith(currentInput));
            if (suggestions.length === 1) {
                this.value = suggestions[0] + " ";
            } else if (suggestions.length > 1) {
                printToOutput(suggestions.join('\n'), 'info');
                scrollToBottom();
            }
        }
    });

    terminalDiv.addEventListener('click', () => {
        commandInput.focus();
    });

    function printToOutput(text, className = '') {
        const newLine = document.createElement('div');
        if (className) {
            newLine.classList.add(className);
        }
        newLine.classList.add('output-line');
        newLine.textContent = text;
        outputDiv.appendChild(newLine);
    }

    function scrollToBottom() {
        terminalDiv.scrollTop = terminalDiv.scrollHeight;
    }

    const commands = {
        'help': () => {
            const helpText = `
Available commands:
  help          Show this help message
  clear         Clear the terminal screen
  date          Display the current date and time
  echo [text]   Display [text]
  whoami        Display the current user
  ls            List files (simulated)
  cat [file]    Display file content (simulated)
  pwd           Print working directory (simulated)
  uname         Print system information (simulated)
  neofetch      Show system information (simulated fancy)
            `;
            printToOutput(helpText.trim());
        },
        'clear': () => {
            outputDiv.innerHTML = '';
        },
        'date': () => {
            printToOutput(new Date().toString());
        },
        'echo': (args) => {
            printToOutput(args.join(' '));
        },
        'whoami': () => {
            printToOutput('user');
        },
        'ls': () => {
            printToOutput('README.md  index.html  terminal.js  style.css (simulated)');
        },
        'cat': (args) => {
            if (args.length === 0) {
                printToOutput('Usage: cat [filename]', 'error');
                return;
            }
            const fileName = args[0];
            const fileContent = {
                'README.md': 'This is a simulated README file for the web terminal.',
                'index.html': '<!DOCTYPE html>...',
                'terminal.js': '// JavaScript for terminal...'
            };
            if (fileContent[fileName]) {
                printToOutput(fileContent[fileName]);
            } else {
                printToOutput(`cat: ${fileName}: No such file or directory`, 'error');
            }
        },
        'pwd': () => {
            printToOutput('/home/user/webterm');
        },
        'uname': () => {
            printToOutput('Linux WebTerminal 1.0 x86_64 GNU/Linux (Simulated)');
        },
        'neofetch': () => {
            const neofetchOutput = `
        .--.
       |o_o |   user@webterm
       |:_/ |   ------------
      //   \ \  OS: WebTerminal GNU/Linux x86_64 (Simulated)
     (|     | ) Host: Your Browser
    /'\_   _/ \` Kernel: Simulated Kernel 5.x
    \___)=(___/  Uptime: (simulated)
                  Shell: bash (simulated)
                  Resolution: ${window.innerWidth}x${window.innerHeight}
                  Terminal: WebTerm
                  CPU: Your CPU (Simulated)
                  GPU: Your GPU (Simulated)
                  Memory: (simulated)
            `;
            printToOutput(neofetchOutput.trim());
        }
    };

    function processCommand(commandText) {
        const parts = commandText.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (commands[command]) {
            try {
                commands[command](args);
            } catch (e) {
                printToOutput(`Error executing command ${command}: ${e.message}`, 'error');
            }
        } else {
            printToOutput(`bash: command not found: ${command}`, 'error');
        }
    }
});
