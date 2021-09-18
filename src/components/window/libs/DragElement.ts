/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-09-18 16:31:30
 * @Description: 实现可移动Object
 * @FilePath: /myindex/src/components/window/libs/DragElement.ts
 */
interface DragObjInter {
    posX: number,
    posY: number,
}
class DragObj implements DragObjInter {
    posX: number;
    posY: number;
    posStartX: number;
    posStartY: number;
    startX: number;
    startY: number;

    notify: Function;
    constructor(x: number, y: number) {
        this.posX = x;
        this.posY = y;
        this.startX = 0;
        this.startY = 0;
        this.posStartX = 0;
        this.posStartY = 0;
        this.notify = () => { };
    }
    onMoving(offsetX: number, offsetY: number) {
        this.posX = this.posStartX + offsetX - this.startX;
        this.posY = this.posStartY + offsetY - this.startY;

        this.notify(this.posX, this.posY)
    }
    startMove(startX: number, startY: number) {
        this.startX = startX;
        this.startY = startY;
        this.posStartX = this.posX;
        this.posStartY = this.posY;
    }
    onDrag(fun: (a0: number, a1: number) => void) {
        this.notify = fun;
    }
}

class DragElement extends DragObj {
    ifDraging: boolean;
    el:any
    constructor(x: number, y: number) {
        super(x, y);
        this.ifDraging = false;
        // this.e = element;
        // this.ifDraging = false;
        // this.e.style.left = this.posX + 'px';
        // this.e.style.top = this.posY + 'px'
        // this.e.addEventListener('mousedown', (ev) => {
        //     this.startMove(ev.pageX, ev.pageY);

        //     this.ifDraging = true;
        // })
        // document.body.addEventListener('mouseup', (ev) => {
        //     this.ifDraging = false;
        // })
        // document.body.addEventListener('mousemove', (ev) => {
            
        //     if (this.ifDraging&&ev.buttons==1) {

        //         this.onMoving(ev.pageX, ev.pageY);
        //         this.e.style.left = this.posX + 'px';
        //         this.e.style.top = this.posY + 'px'
        //     }else if(this.ifDraging&&ev.buttons==0){
        //         this.ifDraging=false

        //     }
        // })
    }
    mountDomEvent(element: any){
        this.el=element;
        this.ifDraging = false;
        element.style.left = this.posX + 'px';
        element.style.top = this.posY + 'px'
        element.addEventListener('mousedown', (ev:any)=>{
            this.startMove(ev.pageX, ev.pageY);
            this.ifDraging = true;
        })
        document.body.addEventListener('mouseup', (ev) => {
            this.ifDraging = false;
            
        })
        document.body.addEventListener('mousemove', (ev) => {
            
            if (this.ifDraging&&ev.buttons==1) {
                
                this.onMoving(ev.pageX, ev.pageY);
                
                element.style.left = this.posX + 'px';
                element.style.top = this.posY + 'px'
            }else if(this.ifDraging&&ev.buttons==0){
                this.ifDraging=false

            }
        })
    }

}

export {
    DragElement
}