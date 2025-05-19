import { isAlphanumericUnderscore, isPrintable } from "./utils/string.js";
import {CustomError,ErrorCodes} from "./utils/error.js"
import * as file from "./filesystem/fileTypes.js"




class Command {
    constructor(name, execFn, description = '') {
        this.name = name;
        this.description = description;
        this.exec = execFn;
    }
}

class User{
    constructor(name, home) {
        this.name = name;
        this.homeDir = new file.Directory(name);
        try{
            home.addFile(this.homeDir);
        }catch(e){
           throw e;
        }
    }
}



class WebTerminal {
    constructor({ outputDiv, commandInput, terminalDiv }) {
        this.outputDiv = outputDiv;
        this.commandInput = commandInput;
        this.terminalDiv = terminalDiv;
        this.history = [];
        this.historyIndex = -1;
        this.commands = {}; // key: fullPath, value: Command
        this.user = null;   // Will hold the User object after login
        this.awaitingLogin = true; // Login state
        this.root=new file.Directory("");
        this.currentDir=this.root;
        this.home=null;
        this.bin=new file.Directory("bin")
        this.path=[new file.Directory()]
        try{
            this.home=new file.Directory("home");
            this.root.addFile(this.home);
        }catch(e){
            if(e instanceof CustomError){
                this.printToOutput(`Error: ${e.message}`, 'error');
            }else{
                this.printToOutput(`Unexpected error: ${e.message}`, 'error');
            }
        }
        this.init();

    }

    init() {
        this.printToOutput(
            `Web Terminal V0.1 (c) 2025`, 'info'
        );
        this.printToOutput(
            `Please enter your username to login:`, 'info'
        );

        this.commandInput.addEventListener('keydown', (event) => this.handleInput(event));
        this.terminalDiv.addEventListener('click', () => this.commandInput.focus());
    }

    handleInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const inputText = this.commandInput.value.trim();
            if (this.awaitingLogin) {
                if (inputText) {
                    if(!isAlphanumericUnderscore(inputText)){
                        this.printToOutput(`Cmon, put a real username.\nOnly alphanumeric and _ are allowed.`, 'error');
                    }else{
                        try{
                            this.user = new User(inputText,this.home);
                            this.currentDir=this.user.homeDir;
                        }catch(e){
                            if(e instanceof CustomError){
                                this.printToOutput(`Error: ${e.message}`, 'error');
                            }else{
                                this.printToOutput(`Unexpected error: ${e.message}`, 'error');
                            }
                        }
                        this.awaitingLogin = false;
                        this.printToOutput(`Welcome, ${this.user.name}!`, 'info');
                        this.printToOutput(`Type 'help' for a list of available commands.`, 'info');
                        // Update the prompt after login
                        const promptSpan = document.getElementById('prompt');
                        if (promptSpan) {
                            promptSpan.textContent = `${this.user.name}@webterm:~$`;
                        }
                    }
                } else {
                    this.printToOutput('Username cannot be empty. Please enter your username:', 'error');
                }
                this.commandInput.value = '';
                this.scrollToBottom();
                return;
            }
            // Normal command handling after login
            if (inputText) {
                this.history.push(inputText);
                this.historyIndex = this.history.length;
                this.printToOutput(`${this.user ? this.user.name : 'user'}@webterm:~$ ${inputText}`, 'command-echo');
                this.processCommand(inputText);
            }
            this.commandInput.value = '';
            this.scrollToBottom();
        } else if (!this.awaitingLogin) {
            // Only allow history navigation and tab completion after login
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (this.history.length > 0 && this.historyIndex > 0) {
                    this.historyIndex--;
                    this.commandInput.value = this.history[this.historyIndex];
                    this.commandInput.setSelectionRange(this.commandInput.value.length, this.commandInput.value.length);
                }
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (this.history.length > 0 && this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.commandInput.value = this.history[this.historyIndex];
                    this.commandInput.setSelectionRange(this.commandInput.value.length, this.commandInput.value.length);
                } else if (this.historyIndex === this.history.length - 1) {
                    this.historyIndex++;
                    this.commandInput.value = '';
                }
            } else if (event.key === 'Tab') {
                event.preventDefault();
                const currentInput = this.commandInput.value.toLowerCase();
                const availableCommands = Object.keys(this.commands);
                const suggestions = availableCommands.filter(cmd => cmd.startsWith(currentInput));
                if (suggestions.length === 1) {
                    this.commandInput.value = suggestions[0] + " ";
                } else if (suggestions.length > 1) {
                    this.printToOutput(suggestions.join('\n'), 'info');
                    this.scrollToBottom();
                }
            }
        }
    }

    printToOutput(text, className = '') {
        const newLine = document.createElement('div');
        if (className) {
            newLine.classList.add(className);
        }
        newLine.classList.add('output-line');
        newLine.textContent = text;
        this.outputDiv.appendChild(newLine);
    }

    scrollToBottom() {
        this.terminalDiv.scrollTop = this.terminalDiv.scrollHeight;
    }

    registerCommand(commandObj) {
        this.commands[commandObj.fullPath] = commandObj;
    }

    // Find command by name or path
    findCommand(input) {
        //fare qualcosa con il path
    }

    // List commands under a path, or all if no path
    listCommands(path = null) {
    }

    processCommand(commandText) {
        const parts = commandText.split(' ');
        const commandInput = parts[0];
        const args = parts.slice(1);

        const cmdObj = this.findCommand(commandInput);
        if (cmdObj) {
            try {
                cmdObj.exec(args, this);
            } catch (e) {
                this.printToOutput(`Error executing command ${cmdObj.name}: ${e.message}`, 'error');
            }
        } else {
            this.printToOutput(`bash: command not found: ${commandInput}`, 'error');
        }
    }
}

// Factory function for commands
function createCommand(path, name, execFn, description = '') {
    return new Command(path, name, execFn, description);
}

document.addEventListener('DOMContentLoaded', () => {
    const outputDiv = document.getElementById('output');
    const commandInput = document.getElementById('commandInput');
    const terminalDiv = document.getElementById('terminal');

    const terminal = new WebTerminal({ outputDiv, commandInput, terminalDiv });

    // Register commands under /bin
    /*terminal.registerCommand(createCommand('/bin', 'help', (args, term) => {
        let path = args[0] || null;
        let cmds = path ? term.listCommands(path) : term.listCommands();
        const helpText = [
            "Available commands:",
            ...cmds.map(cmd =>
                `  ${cmd.fullPath.padEnd(20)}${cmd.description || ''}`
            )
        ].join('\n');
        term.printToOutput(helpText);
    }, "Show this help message"));

    terminal.registerCommand(createCommand('/bin', 'clear', (args, term) => {
        term.outputDiv.innerHTML = '';
    }, "Clear the terminal screen"));

    terminal.registerCommand(createCommand('/bin', 'date', (args, term) => {
        term.printToOutput(new Date().toString());
    }, "Display the current date and time"));

    terminal.registerCommand(createCommand('/bin', 'echo', (args, term) => {
        term.printToOutput(args.join(' '));
    }, "Display [text]"));

    terminal.registerCommand(createCommand('/bin', 'whoami', (args, term) => {
        term.printToOutput('user');
    }, "Display the current user"));

    terminal.registerCommand(createCommand('/bin', 'ls', (args, term) => {
        term.printToOutput('README.md  index.html  terminal.js  style.css (simulated)');
    }, "List files (simulated)"));

    terminal.registerCommand(createCommand('/bin', 'cat', (args, term) => {
        if (args.length === 0) {
            term.printToOutput('Usage: cat [filename]', 'error');
            return;
        }
        const fileName = args[0];
        const fileContent = {
            'README.md': 'This is a simulated README file for the web terminal.',
            'index.html': '<!DOCTYPE html>...',
            'terminal.js': '// JavaScript for terminal...'
        };
        if (fileContent[fileName]) {
            term.printToOutput(fileContent[fileName]);
        } else {
            term.printToOutput(`cat: ${fileName}: No such file or directory`, 'error');
        }
    }, "Display file content (simulated)"));

    terminal.registerCommand(createCommand('/bin', 'pwd', (args, term) => {
        term.printToOutput('/home/user/webterm');
    }, "Print working directory (simulated)"));

    terminal.registerCommand(createCommand('/bin', 'uname', (args, term) => {
        term.printToOutput('Linux WebTerminal 1.0 x86_64 GNU/Linux (Simulated)');
    }, "Print system information (simulated)"));

    terminal.registerCommand(createCommand('/bin', 'neofetch', (args, term) => {
        const neofetchOutput = `
        .--.
       |o_o |   user@webterm
       |:_/ |   ------------
      //   \\ \\  OS: WebTerminal GNU/Linux x86_64 (Simulated)
     (|     | ) Host: Your Browser
    /'\\_   _/ \` Kernel: Simulated Kernel 5.x
    \\___)=(___/  Uptime: (simulated)
                  Shell: bash (simulated)
                  Resolution: ${window.innerWidth}x${window.innerHeight}
                  Terminal: WebTerm
                  CPU: Your CPU (Simulated)
                  GPU: Your GPU (Simulated)
                  Memory: (simulated)
        `;
        term.printToOutput(neofetchOutput.trim());
    }, "Show system information (simulated fancy)"));
    */

    });
