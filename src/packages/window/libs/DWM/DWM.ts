/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 16:22:23
 * @Description: 
 */

// import { WinManagement} from '@libs/DWM/WinManagement';
import * as  WinManagement from '@libs/DWM/WinManagement';

import type { windowInfoMapInter,eventMapInter,WindowInfo } from "@libs/DWM/type";
import {System} from '@libs/System'
class DWM{
    // private static instance: DWM;
    private system:System;
    // WinManagement :WinManagement
    constructor(system:System) {
        this.system = system
        // this.WinManagement =new WinManagement(this.system)
    }
    getWindow(id: string): WindowInfo {
        return WinManagement.getWindow(this.system,id)
    }
    addEventListener(id: string, name: string, func: Function) {
        return WinManagement.addEventListener(this.system,id,name,func)
    }
    upSetWindowIndex(id: string){
        return WinManagement.upSetWindowIndex(this.system,id)
    }
    hideWindow(id: string) {
        return WinManagement.hideWindow(this.system,id)
    }
    showWindow(id: string) {
        return WinManagement.showWindow(this.system,id)
    }
    destoryWindow(id: string) {
        return WinManagement.destoryWindow(this.system,id)
    }
    maxWindow(id: string) {
        return WinManagement.maxWindow(this.system,id)
    }
    on(ev: string, func: Function) {
        return WinManagement.on(this.system,ev,func)
    }
    emit(ev: string, ...args: any) {
        return WinManagement.emit(this.system,ev,...args)
    }

}
export {
    DWM
}