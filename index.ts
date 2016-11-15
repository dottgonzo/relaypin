
type TswitchhAll = "open" | "close" | "switch";
type Tswitch = "open" | "close";

interface IRelaypin {
    normally?: Tswitch;
    pin: number;
    name?: string;
    tags?: string[];
    status?: Tswitch;
    cmdopen?: () => Promise<ISwitchAnswer>;
    cmdclose?: () => Promise<ISwitchAnswer>;
    serial?: false | string;
}

interface ISwitchAnswer {
    name?: string;
    serial?: string;
    status: string;
}

import * as child_process from 'child_process'

import * as Promise from 'bluebird'
const exec = child_process.exec

export default class Relaypin implements IRelaypin {
    normally: Tswitch;
    pin: number;
    name?: string;
    tags: string[] = [];
    status: Tswitch;
    cmdopen: () => Promise<ISwitchAnswer>;
    cmdclose: () => Promise<ISwitchAnswer>;
    onswitch: Function[];
    onopen: Function[];
    onclose: Function[];
    serial: false | string;
    constructor(confpin: IRelaypin) {

        if (!confpin.pin || (confpin.cmdopen && confpin.cmdclose)) {
            throw Error("no pin number provided")
        } else {
            const that = this
            if (confpin.pin) that.pin = confpin.pin
            if (confpin.name) that.name = confpin.name
            if (confpin.serial) {
                that.serial = confpin.serial
            } else {
                that.serial = false
            }
            if (confpin.status) {
                that.status = confpin.status
            } else {
                that.status = that.normally
            }
            if (confpin.normally) {
                that.normally = confpin.normally
            } else {
                that.normally = "open" // default normally
            }

            if (confpin.tags) {
                for (let i = 0; i < confpin.tags.length; i++) {
                    that.tags.push(confpin.tags[i])
                }
            }
            if (confpin.cmdopen) {
                that.cmdopen = confpin.cmdopen
            } else {
                that.cmdopen = function () {
                    return new Promise<ISwitchAnswer>(function (resolve, reject) {
                        exec('echo 1 > /sys/class/gpio/gpio' + that.pin + '/value', function (err, stout, stderr) {
                            if (err) {
                                reject(err)
                            } else {
                                that.status = 'open'
                                const a: ISwitchAnswer = {
                                    status: that.status
                                }
                                if (that.serial) a.serial = that.serial
                                if (that.name) a.name = that.name
                                resolve(a)
                            }
                        })
                    })
                }
            }
            if (confpin.cmdclose) {
                that.cmdclose = confpin.cmdclose
            } else {
                that.cmdclose = function () {
                    return new Promise<ISwitchAnswer>(function (resolve, reject) {
                        exec('echo 0 > /sys/class/gpio/gpio' + that.pin + '/value', function (err, stout, stderr) {
                            if (err) {
                                reject(err)
                            } else {
                                that.status = 'close'
                                const a: ISwitchAnswer = {
                                    status: that.status
                                }
                                if (that.serial) a.serial = that.serial
                                if (that.name) a.name = that.name
                                resolve(a)
                            }
                        })
                    })
                }
            }
        }
    }


    switch() {
        const that = this
        return new Promise<ISwitchAnswer>(function (resolve, reject) {
            if (that.status) {
                that.switchclose().then(function (a) {
                    for (let i = 0; i < that.onswitch.length; i++) {
                        that.onswitch[i]
                    }
                    resolve(a)
                }).catch(function (err) {
                    reject(err)
                })
            } else {
                that.switchopen().then(function (a) {
                    for (let i = 0; i < that.onswitch.length; i++) {
                        that.onswitch[i]
                    }
                    resolve(a)
                }).catch(function (err) {
                    reject(err)
                })
            }
        })
    }
    switchopen() {
        const that = this
        return new Promise<ISwitchAnswer>(function (resolve, reject) {
            if (that.status === 'close') {
                that.cmdopen().then(function (a) {
                    for (let i = 0; i < that.onopen.length; i++) {
                        that.onopen[i]
                    }
                    resolve(a)
                }).catch(function (err) {
                    reject(err)
                })
            }
        })
    }
    switchclose() {
        const that = this
        return new Promise<ISwitchAnswer>(function (resolve, reject) {
            if (that.status === 'close') {
                that.cmdclose().then(function (a) {
                    for (let i = 0; i < that.onclose.length; i++) {
                        that.onclose[i]
                    }
                    resolve(a)
                }).catch(function (err) {
                    reject(err)
                })
            }
        })
    }
    on(value: TswitchhAll, cmd: Function) {
        if (cmd) {
            if (value === 'close') {
                this.onclose.push(cmd)
            } else if (value === 'open') {
                this.onopen.push(cmd)

            } else if (value === 'switch') {
                this.onswitch.push(cmd)

            } else {
                throw Error("no pin number provided")
            }

        } else {
            throw Error("no pin number provided")
        }
    }
}