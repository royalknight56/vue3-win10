import { defineComponent, nextTick, reactive, DefineComponent, markRaw } from "vue";
import { useRootState } from "../state/Root";
// import { BrowserWindowConstructorOptions } from "@packages/type/browserWindow";
// implements BrowserWindowModel
const enum WindowStateEnum {
    normal = 'normal',
    minimize = 'minimize',
    maximize = 'maximize',
    fullscreen = 'fullscreen'
}
interface BrowserWindowConstructorOptions {
    title: string
    content: ReturnType<typeof defineComponent>,
    icon: string
}
interface WindowInfo {
    title: string
    width: number
    height: number
    x: number
    y: number
    resizable: boolean
    state: WindowStateEnum
    istop: boolean
    zindex: number
    isCreated: boolean
    icon: string
}
class BrowserWindow {
    windowInfo: WindowInfo
    private _option: Partial<BrowserWindowConstructorOptions>
    private _builtin: {
        previousState: WindowStateEnum
    }
    id: number
    content?: DefineComponent
    constructor(option?: Partial<BrowserWindowConstructorOptions>, parent?: BrowserWindow) {
        this._option = option || {};
        this.content = markRaw(this._option.content);
        let rootState = useRootState();
        this.id = rootState.system.winnum;
        rootState.system.winnum++;

        this.windowInfo = reactive(Object.assign({}, {
            title: "新窗口",
            width: 800,
            height: 600,
            x: 0,
            y: 0,
            resizable: true,
            state: WindowStateEnum.normal,
            istop: false,
            zindex: 0,
            isCreated: false,
            icon: ""
        }, this._option));
        rootState.system.windowTree.addChild(this);
        rootState.system.windowOrder.push(this);

        this.windowInfo.zindex = rootState.system.windowTree.findIndex(this);
        this._builtin = {
            previousState: this.windowInfo.state
        }

    }
    moveTop() {// 窗口置顶
        let rootState = useRootState();
        let tree = rootState.system.windowTree;
        let node = tree.findNode(this);
        if (node) {
            tree.removeChild(node);
            tree.addChild(this);
        }
        this.windowInfo.zindex =10 + useRootState().system.windowTree.findIndex(this);
    }
    show() {
        this.windowInfo.isCreated = true;
        this.windowInfo.zindex =10 + useRootState().system.windowTree.findIndex(this);
        this.makeWindowNotOverSize();// 使得窗口在生成时，不超过屏幕
        this.moveTop();
    }
    maximize() {// 最大化窗口
        this._setState(WindowStateEnum.maximize);
    }
    unmaximize() {// 取消最大化窗口
        this._setState(WindowStateEnum.normal);
    }
    minimize() {// 最小化窗口
        this._setState(WindowStateEnum.minimize);
    }
    /**
     * Restores the window from minimized state to its previous state.
     */
    restore() {
        this.windowInfo.state = this._builtin.previousState;
    }
    close() {// 关闭窗口
        // TODO:
        this.windowInfo.isCreated = false;
        useRootState().system.windowOrder.splice(useRootState().system.windowOrder.findIndex((val)=>{
            return val.id == this.id;
        }), 1);
    }
    private _setState(state: WindowStateEnum) {
        this._builtin.previousState = this.windowInfo.state;
        this.windowInfo.state = state;
    }
    private getWinInner() {
        let rootState = useRootState();
        return {
            width: rootState.system.info.screenWidth,
            height: rootState.system.info.screenHeight
        }
    }
    private makeWindowNotOverSize() {// 使窗口不超过屏幕大小
        if (this.windowInfo) {
            if (this.windowInfo.resizable) {//只有可缩放窗口
                let { x, y, width, height } = this.windowInfo;
                let { width: winWidth, height: winHeight } = this.getWinInner();//获取窗口大小

                if (winWidth == 0 && winHeight == 0) {
                    return
                }
                if (x + width > winWidth) {
                    this.windowInfo.width = winWidth - x;
                }
                if (y + height > winHeight) {
                    this.windowInfo.height = winHeight - y;
                }
            }
        }
    }
    /*
    private afterRegister() {// 注册之后的操作
        this.makeWindowNotOverSize();// 使得窗口在生成时，不超过屏幕
        if (this.windowInfo.center) {
            this.center()
        }
        nextTick(() => {
            this.moveTop()//新窗口在顶部
        })
    }
    getWinid() {// 获取窗口id
        return this.windowInfo.id
    }
    show() {// 调用show之后，注册窗口，展示窗口
        this.windowInfo.isCreate = true
        this.windowInfo.isVisible = true// 显示窗口
        this.windowInfo.callData = callData || this.windowInfo.callData;
        this.afterRegister()//注册之后
        return this
    }
    hide() {// 隐藏窗口
        this.windowInfo.isVisible = false
        return this
    }
    destroy() {// 销毁窗口
        this.windowInfo.isCreate = false
        this.windowInfo.isMaximize = false;
        this.windowInfo.status = WindowStatusEnum.close
    }
    isMinimized() {// 是否最小化
        return this.windowInfo.isVisible ? false : true
    }
    minimize() {// 最小化窗口
        this.windowInfo.isVisible = false;
        return this
    }
    restore() {// 恢复窗口
        this.windowInfo.isVisible = true;
        return this
    }
    isMaximized() {// 是否最大化
        return this.windowInfo.isMaximize
    }
    maximize() {// 最大化窗口
        this.windowInfo.isMaximize = true;
        this.windowInfo.status = WindowStatusEnum.max
        return this
    }
    unmaximize() {// 取消最大化窗口
        this.windowInfo.isMaximize = false;
        this.windowInfo.status = WindowStatusEnum.normal
        return this
    }
    moveTop() {
        for (let key in this.system.State.windowInfoMap) {
            this.system.State.windowInfoMap[key].windowInfo.istop = false
        }
        this.windowInfo.istop = true

        let ind = this.system.State.zIndexIdArray.indexOf(this.id);
        this.system.State.zIndexIdArray.splice(ind, 1);
        this.system.State.zIndexIdArray.push(this.id);
        for (let i = 0; i < this.system.State.zIndexIdArray.length; i++) {
            this.system.State.windowInfoMap[this.system.State.zIndexIdArray[i]].windowInfo.zindex = i + 10
        }
        return this
    }
    isNormal() {
        return !this.isMaximized() && !this.isMinimized()
    }
    setSize(width: number, height: number) {// 设置窗口大小
        this.windowInfo.width = width;
        this.windowInfo.height = height;
        this.makeWindowNotOverSize();
        return this
    }
    getSize() {// 获取窗口大小
        return {
            width: this.windowInfo.width,
            height: this.windowInfo.height
        }
    }
    setPosition(x: number, y: number) {// 设置窗口位置
        this.windowInfo.x = x;
        this.windowInfo.y = y;
        return this
    }
    getPosition() {// 获取窗口位置
        return {
            x: this.windowInfo.x,
            y: this.windowInfo.y
        }
    }
    center() {
        this.setPosition((this.system.State.sysInfo.width - this.windowInfo.width) / 2, (this.system.State.sysInfo.height - this.windowInfo.height) / 2)
        return this
    }
    setFullScreen(isFull: boolean) {// 设置全屏
        this.windowInfo.fullscreen = isFull;
        if(isFull){
            this.windowInfo.status = WindowStatusEnum.fullscreen
        }else{
            this.windowInfo.status = WindowStatusEnum.normal
        }
    }
    */
}
export {
    BrowserWindow,
    WindowStateEnum
}