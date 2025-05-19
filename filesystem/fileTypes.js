export const FileTypes = Object.freeze({
  FOLDER:   { type: "folder", code: 0 },
  EXE:  { name: "exe", code:1 },
  TEXT:  { name: "text", code:2 },
  FOLDERLINK:{name: "folderLink", code:3}
});
export class File{
    constructor(name, content,type = FileTypes.TEXT) {
        this.name = name;
        this.content = content;
        this.type = type;
    }
}

export class FileExe extends File {
    constructor(name,commandObj) {
        super(name, null, FileTypes.EXE);
        this.command=commandObj;
    }
}

export class Directory extends File{
    constructor(name) {
        super(name, null, FileTypes.FOLDER);
        this.files = [];
        if(name!=="." && name!==".."){
            this.files.push(new FolderLink(".",this));
        }
    }

    addFile(file) {
        const check=this.files.some(sub=>(sub.name===file.name && sub.type===file.type))
        if(check){
            throw new CustomError(`File ${file.name} already exists in ${this.name}`, ErrorCodes.ARG_ALREADY_EXISTS);
        }
        if(file.type===FileTypes.FOLDER){
            const checkParent=file.files.some(f=>(f.name===".." && f.type===FileTypes.FOLDERLINK))
            if (checkParent){
                throw new CustomError(`File ${file.name} already has parent`, ErrorCodes.FOLDER_HAS_PARENT);
            }
            file.addFile(new FolderLink("..",this))
        }
        this.files.push(file);
    }
}

export class FolderLink extends File{
    constructor(name,folder) {
        super(name, null, FileTypes.FOLDERLINK);
        this.folder = folder;
    }
}
