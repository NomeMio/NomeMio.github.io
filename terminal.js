import { isAlphanumericUnderscore, isPrintable } from "./utils/string.js";
import {CustomError,ErrorCodes} from "./utils/error.js"
import * as FILE from "./filesystem/fileTypes.js"




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
        this.homeDir = new FILE.Directory(name);
        try{
            home.addFile(this.homeDir);
        }catch(e){
           throw e;
        }
    }
}
function createCommand( name, execFn, description = '') {
    return new Command(name, execFn, description);
}

function initBasicBin(folder){
    var help=createCommand('help', (args, term) => {
        let cmds = term.listCommands();
        const helpText = [
            "Available commands:",
            ...cmds.map(cmd =>
                `  ${cmd.command.name} :${cmd.command.description || ''}`
            )
        ].join('\n');
        term.printToOutput(helpText);
    }, "Show this help message");
    var helpFile=new FILE.FileExe("help",help);
    folder.addFile(helpFile);
    var clear=createCommand('clear', (args, term) => {
        term.outputDiv.innerHTML = '';
    }, "Clear the terminal screen");
    var clearFile=new FILE.FileExe("clear",clear);
    folder.addFile(clearFile);
    var date=createCommand('date', (args, term) => {
        term.printToOutput(new Date().toString());
    }, "Display the current date and time");
    var dateFile=new FILE.FileExe("date",date);
    folder.addFile(dateFile);
    var echo=createCommand('echo', (args, term) => {
        term.printToOutput(args.join(' '));
    }, "Display [text]");
    var echoFile=new FILE.FileExe("echo",echo);
    folder.addFile(echoFile);
    var whoami=createCommand('whoami', (args, term) => {
        term.printToOutput(term.user.name);
    }, "Display the current user");
    var whoamiFile=new FILE.FileExe("whoami",whoami);
    folder.addFile(whoamiFile);
}

class WebTerminal {
    constructor({ outputDiv, commandInput, terminalDiv }) {
        this.outputDiv = outputDiv;
        this.commandInput = commandInput;
        this.terminalDiv = terminalDiv;
        this.history = [];
        this.historyIndex = -1;
        this.commandsCached = {}; // key: fullPath, value: Command
        this.user = null;   // Will hold the User object after login
        this.awaitingLogin = true; // Login state
        this.root=new FILE.Directory("");
        this.currentDir=this.root;
        this.home=null;
        this.bin=new FILE.Directory("bin")
        this.path=[this.bin]
        try{
            this.home=new FILE.Directory("home");
            this.root.addFile(this.home);
        }catch(e){
            if(e instanceof CustomError){
                this.printToOutput(`Error: ${e.message}`, 'error');
            }else{
                this.printToOutput(`Unexpected error: ${e.message}`, 'error');
            }
        }
        this.init();
        this.commandsCached=this.listCommands();
        initBasicBin(this.bin);
    }

   
    listCommands(){
        var commands=[];
        for (const x of this.path){
            for(const file of x.files){
                if (file.type === FILE.FileTypes.EXE) {
                    commands.push(file);
                }
            }
        }
        return commands;
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
        this.bin.addFile(new FILE.File("ciao.txt","ciao",FILE.FileTypes.TEXT));
        this.listCommands();
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
                const availableCommands = this.commandsCached;
                const suggestions = availableCommands.filter(cmd => cmd.name.startsWith(currentInput));
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


    processCommand(commandText) {
        //for now mono comand but i want to add shell operators
        const parts = commandText.split(' ');
        const commandInput = parts[0];
        const args = parts.slice(1);
        var commandFile=null;
        for (const x of this.path) {
            const temp=x.searchForFile(commandInput);
            if(temp){
                if(temp.type===FILE.FileTypes.EXE){
                    commandFile=temp;
                    break;
                }
                continue;
            }
        }
        console.log(commandFile);
        if (commandFile) {
            try {
                commandFile.command.exec(args, this);
            } catch (e) {
                this.printToOutput(`Error executing command ${commandFile.name}: ${e.message}`, 'error');
            }
        } else {
            this.printToOutput(`bash: command not found: ${commandInput}`, 'error');
        }
    }
}

// Factory function for commands

document.addEventListener('DOMContentLoaded', () => {
    const outputDiv = document.getElementById('output');
    const commandInput = document.getElementById('commandInput');
    const terminalDiv = document.getElementById('terminal');

    const terminalObj = new WebTerminal({ outputDiv, commandInput, terminalDiv });


    });
