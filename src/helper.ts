export class Helper {

    fwdPressed: boolean = false;
    bkdPressed: boolean = false;
    rgtPressed: boolean = false;
    lftPressed: boolean = false;
    spacePressed: boolean = false;
    //object hint spawn
    ePressed: boolean = false;

    get isFwdPressed() { return this.fwdPressed; }
    get isBkdPressed() { return this.bkdPressed; } 
    get isRgtPressed() { return this.rgtPressed; }
    get isLftPressed() { return this.lftPressed; }
    get isSpacePressed() { return this.spacePressed; }
    get isePressed() { return this.ePressed; }

    constructor() {}

    listener(){
        window.addEventListener( 'keydown', this.keyDownFunc); 
        window.addEventListener( 'keyup', this.keyUpFunc);
    }


    keyDownFunc = (e: KeyboardEvent) => {
    switch (e.code) {
        case 'KeyW': this.fwdPressed = true; break;
        case 'KeyS': this.bkdPressed = true; break;
        case 'KeyD': this.rgtPressed = true; break;
        case 'KeyA': this.lftPressed = true; break;
        case 'Space': this.spacePressed = true; break;
        case 'KeyE': this.ePressed = true; break;
        }
    }

keyUpFunc = (e: KeyboardEvent) => {
    switch (e.code) {
        case 'KeyW': this.fwdPressed = false; break;
        case 'KeyS': this.bkdPressed = false; break;
        case 'KeyD': this.rgtPressed = false; break;
        case 'KeyA': this.lftPressed = false; break;
        case 'Space': this.spacePressed = false; break;
        case 'KeyE': this.ePressed = false; break;
        }
    }

}